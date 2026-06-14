export type LlmProviderId =
  | 'openai'
  | 'gemini'
  | 'openrouter'
  | 'anthropic'
  | 'claude'
  | 'groq'
  | string;

export type ProviderErrorCode =
  | 'INVALID_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMIT'
  | 'PROVIDER_OUTAGE'
  | 'MODEL_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface FormattedProviderError {
  code: ProviderErrorCode;
  title: string;
  description: string;
  helpUrl?: string;
  retryable: boolean;
  /** True when the failure originated from an upstream LLM provider response. */
  isProviderIssue: boolean;
  provider?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic Claude',
  claude: 'Anthropic Claude',
  groq: 'Groq',
};

const ERROR_TITLES: Record<ProviderErrorCode, string> = {
  INVALID_API_KEY: 'API Key Invalid or Expired',
  QUOTA_EXCEEDED: 'Usage Limit Reached',
  RATE_LIMIT: 'Too Many Requests',
  PROVIDER_OUTAGE: 'Provider Temporarily Unavailable',
  MODEL_NOT_FOUND: 'Selected Model Not Available',
  PERMISSION_DENIED: 'API Key Lacks Required Permissions',
  NETWORK_ERROR: 'Connection Problem',
  UNKNOWN: 'Request Failed',
};

const ERROR_DESCRIPTIONS: Record<ProviderErrorCode, string> = {
  INVALID_API_KEY:
    'The API key was rejected. Generate a new key in your provider dashboard and update it in Settings.',
  QUOTA_EXCEEDED:
    'Your provider account has hit its usage or billing limit. Check quota and billing before trying again.',
  RATE_LIMIT:
    'The provider is throttling requests. Wait a minute and try again, or reduce how often you run scans.',
  PROVIDER_OUTAGE:
    'The AI provider is having temporary issues. Wait a few minutes and retry.',
  MODEL_NOT_FOUND:
    'The selected model is not available for your API key or region. Pick another model in Settings.',
  PERMISSION_DENIED:
    'Your API key does not have permission for this operation. Check key scope and organization access.',
  NETWORK_ERROR:
    'Could not reach the server. Check your internet connection and try again.',
  UNKNOWN:
    'Something went wrong while contacting the AI provider. Try again or verify your API key in Settings.',
};

const PROVIDER_HELP: Record<string, Partial<Record<ProviderErrorCode, string>>> = {
  openai: {
    INVALID_API_KEY: 'https://platform.openai.com/api-keys',
    QUOTA_EXCEEDED: 'https://platform.openai.com/account/billing',
    RATE_LIMIT: 'https://platform.openai.com/docs/guides/rate-limits',
    MODEL_NOT_FOUND: 'https://platform.openai.com/docs/models',
    PERMISSION_DENIED: 'https://platform.openai.com/api-keys',
    PROVIDER_OUTAGE: 'https://status.openai.com/',
  },
  gemini: {
    INVALID_API_KEY: 'https://aistudio.google.com/app/apikey',
    QUOTA_EXCEEDED: 'https://ai.google.dev/gemini-api/docs/rate-limits',
    RATE_LIMIT: 'https://ai.google.dev/gemini-api/docs/rate-limits',
    MODEL_NOT_FOUND: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    PERMISSION_DENIED: 'https://aistudio.google.com/app/apikey',
    PROVIDER_OUTAGE: 'https://status.cloud.google.com/',
  },
  openrouter: {
    INVALID_API_KEY: 'https://openrouter.ai/settings/keys',
    QUOTA_EXCEEDED: 'https://openrouter.ai/settings/credits',
    RATE_LIMIT: 'https://openrouter.ai/docs/faq',
    MODEL_NOT_FOUND: 'https://openrouter.ai/models',
    PERMISSION_DENIED: 'https://openrouter.ai/settings/keys',
    PROVIDER_OUTAGE: 'https://status.openrouter.ai/',
  },
  claude: {
    INVALID_API_KEY: 'https://console.anthropic.com/settings/keys',
    QUOTA_EXCEEDED: 'https://console.anthropic.com/settings/billing',
    RATE_LIMIT: 'https://docs.anthropic.com/en/api/rate-limits',
    MODEL_NOT_FOUND: 'https://docs.anthropic.com/en/docs/about-claude/models',
    PERMISSION_DENIED: 'https://console.anthropic.com/settings/keys',
    PROVIDER_OUTAGE: 'https://status.anthropic.com/',
  },
  anthropic: {
    INVALID_API_KEY: 'https://console.anthropic.com/settings/keys',
    QUOTA_EXCEEDED: 'https://console.anthropic.com/settings/billing',
    RATE_LIMIT: 'https://docs.anthropic.com/en/api/rate-limits',
    MODEL_NOT_FOUND: 'https://docs.anthropic.com/en/docs/about-claude/models',
    PERMISSION_DENIED: 'https://console.anthropic.com/settings/keys',
    PROVIDER_OUTAGE: 'https://status.anthropic.com/',
  },
  groq: {
    INVALID_API_KEY: 'https://console.groq.com/keys',
    QUOTA_EXCEEDED: 'https://console.groq.com/docs/rate-limits',
    RATE_LIMIT: 'https://console.groq.com/docs/rate-limits',
    MODEL_NOT_FOUND: 'https://console.groq.com/docs/models',
    PERMISSION_DENIED: 'https://console.groq.com/keys',
    PROVIDER_OUTAGE: 'https://status.groq.com/',
  },
};

export interface ProviderApiErrorPayload {
  code: ProviderErrorCode;
  provider?: string;
  message: string;
  retryable?: boolean;
}

export function isProviderApiError(value: unknown): value is ProviderApiErrorPayload {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.code === 'string' &&
    typeof o.message === 'string' &&
    ERROR_TITLES[o.code as ProviderErrorCode] !== undefined
  );
}

export function extractProviderApiError(raw: unknown): ProviderApiErrorPayload | null {
  if (isProviderApiError(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const nested = (raw as Record<string, unknown>).error;
    if (isProviderApiError(nested)) return nested;
  }
  return null;
}

const RETRYABLE_CODES = new Set<ProviderErrorCode>([
  'RATE_LIMIT',
  'PROVIDER_OUTAGE',
  'NETWORK_ERROR',
  'UNKNOWN',
]);

interface ParsedErrorShape {
  message: string;
  status?: number | string;
  code?: string;
  type?: string;
  nestedStatus?: string;
}

function normalizeProviderId(provider?: LlmProviderId): string {
  const p = String(provider || '')
    .trim()
    .toLowerCase();
  if (p === 'anthropic') return 'claude';
  return p || 'openai';
}

function providerLabel(provider?: string): string {
  if (!provider) return 'AI provider';
  return PROVIDER_LABELS[provider] || provider;
}

function coerceRawError(rawError: unknown): string {
  if (rawError == null) return '';
  if (typeof rawError === 'string') return rawError.trim();
  if (rawError instanceof Error) return rawError.message.trim();
  if (typeof rawError === 'object') {
    const obj = rawError as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message.trim();
    if (typeof obj.error === 'string') return obj.error.trim();
    if (obj.error && typeof obj.error === 'object') {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === 'string') return nested.message.trim();
    }
    try {
      return JSON.stringify(rawError);
    } catch {
      return String(rawError);
    }
  }
  return String(rawError).trim();
}

function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractHttpStatus(text: string): number | undefined {
  const patterns = [
    /\((\d{3})\)/,
    /error\s*\((\d{3})\)/i,
    /HTTP\s*(\d{3})/i,
    /status[:\s]+(\d{3})/i,
    /\b(\d{3})\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const code = Number(match[1]);
      if (code >= 400 && code <= 599) return code;
    }
  }
  return undefined;
}

function flattenErrorObject(value: unknown, depth = 0): ParsedErrorShape {
  if (depth > 4 || value == null) {
    return { message: '' };
  }

  if (typeof value === 'string') {
    return { message: value };
  }

  if (typeof value !== 'object') {
    return { message: String(value) };
  }

  const obj = value as Record<string, unknown>;
  const errorNode =
    obj.error && typeof obj.error === 'object' ? (obj.error as Record<string, unknown>) : null;

  const message =
    (typeof obj.message === 'string' && obj.message) ||
    (errorNode && typeof errorNode.message === 'string' && errorNode.message) ||
    (typeof obj.detail === 'string' && obj.detail) ||
    (typeof obj.title === 'string' && obj.title) ||
    '';

  const status =
    (typeof obj.status === 'number' && obj.status) ||
    (typeof obj.status === 'string' && obj.status) ||
    (typeof obj.code === 'number' && obj.code) ||
    undefined;

  const code =
    (typeof obj.code === 'string' && obj.code) ||
    (errorNode && typeof errorNode.code === 'string' && errorNode.code) ||
    (typeof obj.type === 'string' && obj.type) ||
    (errorNode && typeof errorNode.type === 'string' && errorNode.type) ||
    undefined;

  const type =
    (typeof obj.type === 'string' && obj.type) ||
    (errorNode && typeof errorNode.type === 'string' && errorNode.type) ||
    undefined;

  const nestedStatus =
    (errorNode && typeof errorNode.status === 'string' && errorNode.status) ||
    (typeof obj.status === 'string' && obj.status) ||
    undefined;

  return {
    message: String(message || ''),
    status,
    code: code ? String(code) : undefined,
    type: type ? String(type) : undefined,
    nestedStatus: nestedStatus ? String(nestedStatus) : undefined,
  };
}

function extractEmbeddedJson(text: string): unknown | null {
  const jsonStart = text.indexOf('{');
  if (jsonStart < 0) return null;
  return tryParseJson(text.slice(jsonStart));
}

function extractPrefixedHttpStatus(text: string): number | undefined {
  const prefixed = text.match(/api error\s*\((\d{3})\)/i);
  if (prefixed) {
    const code = Number(prefixed[1]);
    if (code >= 400 && code <= 599) return code;
  }
  return extractHttpStatus(text);
}

function looksLikeProviderPayload(text: string): boolean {
  if (!text) return false;
  if (tryParseJson(text) || extractEmbeddedJson(text)) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('"error"') ||
    lower.includes('invalid api key') ||
    lower.includes('incorrect api key') ||
    lower.includes('api key not valid') ||
    lower.includes('authentication') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('insufficient_quota') ||
    lower.includes('model_not_found') ||
    lower.includes('permission') ||
    lower.includes('api key validation failed') ||
    lower.includes('gemini api error') ||
    lower.includes('gemini api:') ||
    lower.includes('openrouter api:') ||
    lower.includes('openai api error') ||
    lower.includes('llm request failed') ||
    lower.includes('invalid_argument') ||
    /invalid\s+(openai|gemini|openrouter|claude|groq|anthropic)\s+key/.test(lower)
  );
}

function classifyError(
  text: string,
  parsed: ParsedErrorShape,
  provider: string
): ProviderErrorCode {
  const blob = `${text} ${parsed.message} ${parsed.code || ''} ${parsed.type || ''} ${
    parsed.nestedStatus || ''
  }`.toLowerCase();

  const httpStatus =
    (typeof parsed.status === 'number' ? parsed.status : undefined) ||
    (typeof parsed.status === 'string' ? Number(parsed.status) : undefined) ||
    extractHttpStatus(text);

  if (
    blob.includes('resource_exhausted') ||
    blob.includes('insufficient_quota') ||
    blob.includes('quota exceeded') ||
    blob.includes('billing') ||
    blob.includes('exceeded your current quota') ||
    blob.includes('usage limit') ||
    (provider === 'gemini' && httpStatus === 429)
  ) {
    return 'QUOTA_EXCEEDED';
  }

  if (
    blob.includes('invalid api key') ||
    blob.includes('incorrect api key') ||
    blob.includes('invalid_api_key') ||
    blob.includes('authentication_error') ||
    blob.includes('invalid x-api-key') ||
    blob.includes('unauthorized') ||
    blob.includes('api key not valid') ||
    blob.includes('api key validation failed') ||
    blob.includes('invalid_argument') ||
    /invalid\s+(openai|gemini|openrouter|claude|groq|anthropic)\s+key/.test(blob) ||
    httpStatus === 401
  ) {
    return 'INVALID_API_KEY';
  }

  if (
    blob.includes('permission') ||
    blob.includes('forbidden') ||
    blob.includes('not allowed') ||
    blob.includes('access denied') ||
    httpStatus === 403
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    blob.includes('model_not_found') ||
    blob.includes('model not found') ||
    blob.includes('not found for api version') ||
    blob.includes('does not exist') ||
    (blob.includes('model') && httpStatus === 404)
  ) {
    return 'MODEL_NOT_FOUND';
  }

  if (
    blob.includes('rate limit') ||
    blob.includes('rate_limit') ||
    blob.includes('too many requests') ||
    blob.includes('requests per minute') ||
    blob.includes('rpm') ||
    httpStatus === 429
  ) {
    return 'RATE_LIMIT';
  }

  if (
    blob.includes('overloaded') ||
    blob.includes('service unavailable') ||
    blob.includes('internal server error') ||
    blob.includes('bad gateway') ||
    blob.includes('gateway timeout') ||
    blob.includes('temporarily unavailable') ||
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504
  ) {
    return 'PROVIDER_OUTAGE';
  }

  if (
    blob.includes('network error') ||
    blob.includes('failed to fetch') ||
    blob.includes('fetch failed') ||
    blob.includes('connection') ||
    blob.includes('timeout') ||
    blob.includes('econnreset')
  ) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN';
}

function isAppLocalMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.startsWith('enter your ') ||
    lower.startsWith('you must be logged in') ||
    lower.includes('enter a key to save') ||
    lower.includes('could not update active provider') ||
    lower.includes('something went wrong') ||
    lower.includes('failed to save key') ||
    lower.includes('could not analyze resume') ||
    lower.includes('could not save api key') ||
    lower.includes('could not improve resume')
  );
}

function helpUrlFor(provider: string, code: ProviderErrorCode): string | undefined {
  return PROVIDER_HELP[provider]?.[code] || PROVIDER_HELP[provider]?.UNKNOWN;
}

function formatFromStructuredError(
  fallbackProvider: string,
  payload: ProviderApiErrorPayload
): FormattedProviderError {
  const normalizedProvider = normalizeProviderId(payload.provider || fallbackProvider);
  const code = payload.code;
  return buildFormattedResult(
    normalizedProvider,
    code,
    true,
    payload.message,
    payload.retryable
  );
}

/**
 * Turn a raw provider/Lambda error into a safe, user-facing message.
 * Accepts structured `ProviderApiErrorPayload`, API bodies with `{ error }`, or legacy strings.
 * Never returns raw JSON in description.
 */
export function formatProviderError(
  provider: LlmProviderId | undefined,
  rawError: unknown
): FormattedProviderError {
  const normalizedProvider = normalizeProviderId(provider);
  const structured = extractProviderApiError(rawError);
  if (structured) {
    return formatFromStructuredError(normalizedProvider, structured);
  }

  const text = coerceRawError(rawError);

  if (!text) {
    return {
      code: 'UNKNOWN',
      title: ERROR_TITLES.UNKNOWN,
      description: ERROR_DESCRIPTIONS.UNKNOWN,
      helpUrl: helpUrlFor(normalizedProvider, 'UNKNOWN'),
      retryable: true,
      isProviderIssue: true,
      provider: normalizedProvider,
    };
  }

  if (isAppLocalMessage(text) && !looksLikeProviderPayload(text)) {
    return {
      code: 'UNKNOWN',
      title: 'Action required',
      description: text,
      retryable: false,
      isProviderIssue: false,
      provider: normalizedProvider,
    };
  }

  const parsedJson = tryParseJson(text) ?? extractEmbeddedJson(text);
  const parsed = flattenErrorObject(parsedJson ?? { message: text });
  const prefixedStatus = extractPrefixedHttpStatus(text);
  if (prefixedStatus && parsed.status == null) {
    parsed.status = prefixedStatus;
  }
  const isProviderIssue = looksLikeProviderPayload(text) || Boolean(parsedJson);
  const code = classifyError(text, parsed, normalizedProvider);

  return buildFormattedResult(normalizedProvider, code, isProviderIssue, text);
}

function buildFormattedResult(
  normalizedProvider: string,
  code: ProviderErrorCode,
  isProviderIssue: boolean,
  text: string,
  retryableOverride?: boolean
): FormattedProviderError {
  let description = ERROR_DESCRIPTIONS[code];
  if (code === 'INVALID_API_KEY') {
    description = `${providerLabel(normalizedProvider)} rejected the API key. Create or paste a valid key in Settings.`;
  } else if (code === 'QUOTA_EXCEEDED' && normalizedProvider === 'gemini') {
    description =
      'Your Gemini project has reached its free-tier or billing quota. Review usage and limits in Google AI Studio, then try again.';
  } else if (code === 'RATE_LIMIT') {
    description = `${providerLabel(normalizedProvider)} is rate-limiting requests. Wait briefly before retrying.`;
  } else if (code === 'MODEL_NOT_FOUND') {
    description = `The model configured for ${providerLabel(normalizedProvider)} is unavailable. Choose a different model in Settings.`;
  }

  return {
    code,
    title: ERROR_TITLES[code],
    description,
    helpUrl: helpUrlFor(normalizedProvider, code),
    retryable: retryableOverride ?? RETRYABLE_CODES.has(code),
    isProviderIssue,
    provider: normalizedProvider,
  };
}
