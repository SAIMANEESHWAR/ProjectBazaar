/**
 * AWS Lambda — Company Posts → DynamoDB (copy-paste friendly, Node.js 18.x / 20.x)
 *
 * Environment variables (Lambda configuration):
 *   TABLE_NAME          — DynamoDB table name (default: CompanyPosts)
 *   AUTO_CREATE_TABLE   — set to "true" to create the table on first run (needs dynamodb:CreateTable)
 *
 * IAM permissions (minimum):
 *   dynamodb:DescribeTable, dynamodb:CreateTable (only if AUTO_CREATE_TABLE=true)
 *   dynamodb:PutItem, dynamodb:GetItem, dynamodb:Query, dynamodb:UpdateItem
 *
 * API Gateway (HTTP API or REST): proxy integration to this Lambda.
 *
 * --- Routes (query / path) ---
 *   POST   /posts           — body: full post JSON (see shape below)
 *   GET    /posts?id=...    — single post by postId
 *   GET    /posts?mode=stream&limit=25&cursor=...  — recent posts (newest first)
 *   GET    /posts?mode=category&category=interview-experience&limit=25&cursor=...
 *   GET    /posts?mode=company&companyName=Google&limit=25&cursor=...
 *   GET    /posts?mode=author&authorId=user@email.com&limit=25&cursor=...
 *
 * cursor: pass the entire `nextCursor` object from the previous response, URL-encoded JSON
 *   Example: cursor=encodeURIComponent(JSON.stringify(nextCursor))
 *
 * Anonymous posts: send isAnonymous: true (and/or authorName: "Anonymous").
 *   Real authorId/email is NOT stored on the item when isAnonymous is true (privacy).
 *
 * --- Example IAM policy (attach to Lambda role) ---
 * {
 *   "Version": "2012-10-17",
 *   "Statement": [
 *     { "Effect": "Allow", "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"], "Resource": "*" },
 *     { "Effect": "Allow", "Action": ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:UpdateItem"], "Resource": ["arn:aws:dynamodb:REGION:ACCOUNT:table/CompanyPosts","arn:aws:dynamodb:REGION:ACCOUNT:table/CompanyPosts/index/*"] },
 *     { "Effect": "Allow", "Action": ["dynamodb:DescribeTable","dynamodb:CreateTable"], "Resource": "arn:aws:dynamodb:REGION:ACCOUNT:table/CompanyPosts" }
 *   ]
 * }
 * (Omit CreateTable if you create the table in CloudFormation/Console and set AUTO_CREATE_TABLE=false)
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });
const docClient = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });

const TABLE_NAME = process.env.TABLE_NAME || 'CompanyPosts';
const AUTO_CREATE = String(process.env.AUTO_CREATE_TABLE || '').toLowerCase() === 'true';

// GSI names (must match createTable)
const GSI = {
    CATEGORY: 'GSI_Category_CreatedAt',
    COMPANY: 'GSI_Company_CreatedAt',
    AUTHOR: 'GSI_Author_CreatedAt',
    STREAM: 'GSI_Stream_CreatedAt',
};

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function response(statusCode, body) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: typeof body === 'string' ? body : JSON.stringify(body),
    };
}

function parseEvent(event) {
    const method =
        event.requestContext?.http?.method ||
        event.httpMethod ||
        (event.requestContext?.httpMethod) ||
        'GET';

    const path = event.rawPath || event.path || '';
    const qs = event.queryStringParameters || {};
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return { error: 'Invalid JSON body' };
        }
    }
    return { method, path, qs, body, raw: event };
}

async function waitForTableActive(name, maxAttempts = 24) {
    for (let i = 0; i < maxAttempts; i++) {
        const d = await dynamodb.describeTable({ TableName: name }).promise();
        if (d.Table.TableStatus === 'ACTIVE') return;
        await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error('Table did not become ACTIVE in time');
}

async function ensureTableExists() {
    if (!AUTO_CREATE) return;
    try {
        await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
        return;
    } catch (err) {
        if (err.code !== 'ResourceNotFoundException') throw err;
    }

    const params = {
        TableName: TABLE_NAME,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
            { AttributeName: 'postId', AttributeType: 'S' },
            { AttributeName: 'category', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
            { AttributeName: 'companyName', AttributeType: 'S' },
            { AttributeName: 'authorPartition', AttributeType: 'S' },
            { AttributeName: 'streamKey', AttributeType: 'S' },
        ],
        KeySchema: [{ AttributeName: 'postId', KeyType: 'HASH' }],
        GlobalSecondaryIndexes: [
            {
                IndexName: GSI.CATEGORY,
                KeySchema: [
                    { AttributeName: 'category', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
            {
                IndexName: GSI.COMPANY,
                KeySchema: [
                    { AttributeName: 'companyName', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
            {
                IndexName: GSI.AUTHOR,
                KeySchema: [
                    { AttributeName: 'authorPartition', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
            {
                IndexName: GSI.STREAM,
                KeySchema: [
                    { AttributeName: 'streamKey', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
    };

    await dynamodb.createTable(params).promise();
    await waitForTableActive(TABLE_NAME);
}

function nowIso() {
    return new Date().toISOString();
}

function randomSuffix() {
    return Math.random().toString(36).slice(2, 10);
}

/**
 * Build DynamoDB item from client payload + request context.
 * When isAnonymous is true, real identity is not persisted (only display + partition ANONYMOUS).
 */
function buildPostItem(payload, requestContext, httpEvent) {
    const isAnonymous = Boolean(payload.isAnonymous);
    const createdAt = payload.createdAt && String(payload.createdAt).trim() ? String(payload.createdAt).trim() : nowIso();
    const postId =
        payload.postId && String(payload.postId).trim()
            ? String(payload.postId).trim()
            : `post-${Date.now()}-${randomSuffix()}`;

    const authorDisplayName = isAnonymous ? 'Anonymous' : String(payload.authorName || payload.authorDisplayName || 'User').trim() || 'User';

    /** Real user id from body or API authorizer (never stored when anonymous) */
    const realAuthorId =
        !isAnonymous &&
        (payload.authorId ||
            requestContext?.authorizer?.jwt?.claims?.email ||
            requestContext?.authorizer?.claims?.email ||
            requestContext?.identity?.cognitoIdentityId ||
            null);

    const authorPartition = isAnonymous ? 'ANONYMOUS' : realAuthorId ? `USER#${String(realAuthorId)}` : 'USER#UNKNOWN';

    const companyName = String(payload.companyName || 'General').trim() || 'General';
    const category = String(payload.category || 'career-discussion');

    const item = {
        postId,
        streamKey: 'POST_STREAM',
        category,
        companyName,
        createdAt,
        updatedAt: nowIso(),
        serverReceivedAt: nowIso(),

        isAnonymous,
        authorPartition,
        authorDisplayName,
        /** Same as UI field `authorName` on CompanyPost */
        authorName: authorDisplayName,
        /** Only set when not anonymous */
        ...(isAnonymous ? {} : { authorId: realAuthorId || null }),

        isAdminCompany: Boolean(payload.isAdminCompany),
        role: String(payload.role || 'General'),
        title: String(payload.title || ''),
        content: String(payload.content || ''),

        location: payload.location || undefined,
        experienceLevel: payload.experienceLevel || undefined,
        interviewRound: payload.interviewRound || undefined,
        packageDetails: payload.packageDetails || undefined,
        companyRating: typeof payload.companyRating === 'number' ? payload.companyRating : undefined,
        careerTopic: payload.careerTopic || undefined,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        upvotes: typeof payload.upvotes === 'number' ? payload.upvotes : 0,
        comments: Array.isArray(payload.comments) ? payload.comments : [],

        /** Audit / future analytics (no PII when anonymous) */
        metadata: {
            source: 'company-posts-api',
            requestId: requestContext?.requestId || httpEvent?.requestContext?.requestId || null,
            stage: requestContext?.stage || null,
            apiId: requestContext?.apiId || null,
            userAgent:
                (httpEvent?.headers && (httpEvent.headers['user-agent'] || httpEvent.headers['User-Agent'])) ||
                requestContext?.identity?.userAgent ||
                null,
            sourceIp: requestContext?.http?.sourceIp || requestContext?.identity?.sourceIp || null,
        },
    };

    Object.keys(item).forEach(k => {
        if (item[k] === undefined) delete item[k];
    });

    return item;
}

async function putPost(item) {
    await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
    return item;
}

async function getPostById(postId) {
    const r = await docClient.get({ TableName: TABLE_NAME, Key: { postId } }).promise();
    return r.Item || null;
}

function decodeCursor(qs) {
    if (!qs.cursor) return undefined;
    try {
        const raw = decodeURIComponent(qs.cursor);
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

async function queryGsi(indexName, keyName, keyValue, limit, exclusiveStartKey, scanForward = false) {
    const lim = Math.min(Math.max(parseInt(String(limit || 25), 10) || 25, 1), 100);
    const params = {
        TableName: TABLE_NAME,
        IndexName: indexName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: { '#pk': keyName },
        ExpressionAttributeValues: { ':pk': keyValue },
        Limit: lim,
        ScanIndexForward: scanForward,
    };
    if (exclusiveStartKey && Object.keys(exclusiveStartKey).length) {
        params.ExclusiveStartKey = exclusiveStartKey;
    }
    const r = await docClient.query(params).promise();
    return {
        items: r.Items || [],
        nextCursor: r.LastEvaluatedKey || null,
    };
}

exports.handler = async (event) => {
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
        return response(204, '');
    }

    try {
        await ensureTableExists();
    } catch (e) {
        console.error('ensureTableExists', e);
        return response(500, { error: 'Table setup failed', detail: e.message });
    }

    const parsed = parseEvent(event);
    if (parsed.error) return response(400, { error: parsed.error });

    const { method, qs, body, raw } = parsed;
    const requestContext = raw.requestContext || {};

    try {
        if (method === 'GET') {
            if (qs.id) {
                const item = await getPostById(qs.id);
                if (!item) return response(404, { error: 'Not found' });
                return response(200, { post: item });
            }

            const mode = (qs.mode || 'stream').toLowerCase();
            const limit = qs.limit;
            const cursor = decodeCursor(qs);

            if (mode === 'stream') {
                const r = await queryGsi(GSI.STREAM, 'streamKey', 'POST_STREAM', limit, cursor, false);
                return response(200, { posts: r.items, nextCursor: r.nextCursor });
            }

            if (mode === 'category') {
                if (!qs.category) return response(400, { error: 'category is required' });
                const r = await queryGsi(GSI.CATEGORY, 'category', qs.category, limit, cursor, false);
                return response(200, { posts: r.items, nextCursor: r.nextCursor });
            }

            if (mode === 'company') {
                if (!qs.companyName) return response(400, { error: 'companyName is required' });
                const r = await queryGsi(GSI.COMPANY, 'companyName', qs.companyName, limit, cursor, false);
                return response(200, { posts: r.items, nextCursor: r.nextCursor });
            }

            if (mode === 'author') {
                if (!qs.authorId) return response(400, { error: 'authorId is required (email or stable user id)' });
                const r = await queryGsi(GSI.AUTHOR, 'authorPartition', `USER#${qs.authorId}`, limit, cursor, false);
                return response(200, { posts: r.items, nextCursor: r.nextCursor });
            }

            return response(400, {
                error: 'Unknown mode',
                hint: 'Use mode=stream|category|company|author or id=<postId>',
            });
        }

        if (method === 'POST') {
            if (!body || typeof body !== 'object') return response(400, { error: 'JSON body required' });
            const item = buildPostItem(body, requestContext, raw);
            await putPost(item);
            return response(201, { ok: true, post: item });
        }

        return response(405, { error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response(500, { error: 'Server error', detail: err.message });
    }
};
