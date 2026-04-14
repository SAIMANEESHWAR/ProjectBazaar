import { jobPortals, coldDMTemplates } from '../data/preparationMockData';

const PREP_ADMIN_ENDPOINT = process.env.VITE_PREP_ADMIN_ENDPOINT || 'https://rsesb93sz6.execute-api.ap-south-2.amazonaws.com/default/prep_admin_handler';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
    message?: string;
    [key: string]: unknown;
}

async function adminRequest<T = unknown>(
    action: string,
    body: Record<string, unknown> = {},
): Promise<ApiResponse<T> & Record<string, unknown>> {
    try {
        const res = await fetch(PREP_ADMIN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...body }),
        });
        return (await res.json()) as any;
    } catch (err) {
        console.error(`[prepAdmin] ${action} failed:`, err);
        return {
            success: false,
            error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' },
        };
    }
}

async function fullSyncContent(contentType: string, items: Record<string, unknown>[]): Promise<boolean> {
    const resp = await adminRequest('full_sync_content', { contentType, items });
    if (!resp.success) {
        console.error(`Failed to sync ${contentType}:`, resp.error || resp.message);
    }
    return resp.success === true;
}

async function main() {
    console.log('Seeding Job Portals...');
    const jpSuccess = await fullSyncContent('job_portals', jobPortals as any);
    if (jpSuccess) {
        console.log(`Successfully synced ${jobPortals.length} job portals.`);
    } else {
        console.error('Failed to sync job portals.');
    }

    console.log('\nSeeding Cold DM Templates...');
    const dmSuccess = await fullSyncContent('cold_dm_templates', coldDMTemplates as any);
    if (dmSuccess) {
        console.log(`Successfully synced ${coldDMTemplates.length} cold DM templates.`);
    } else {
        console.error('Failed to sync cold DM templates.');
    }

    console.log('\nProcess finished.');
}

main();
