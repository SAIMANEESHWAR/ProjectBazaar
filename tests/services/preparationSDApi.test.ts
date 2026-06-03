import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepAdminApi, PREP_SD_MEDIA_BUCKET } from '../../services/preparationApi';

// ─── Mock fetch globally ──────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ─── Mock localStorage ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mockSuccess(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  });
}

describe('PREP_SD_MEDIA_BUCKET', () => {
  it('is exported as a non-empty string', () => {
    expect(typeof PREP_SD_MEDIA_BUCKET).toBe('string');
    expect(PREP_SD_MEDIA_BUCKET.length).toBeGreaterThan(0);
  });
});

describe('prepAdminApi.getSystemDesignUploadUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls action get_sd_media_upload_url with filename and contentType', async () => {
    mockSuccess({
      success: true,
      uploadUrl: 'https://presigned.example.com/upload',
      s3Key: 'system-design/img-123/diagram.png',
      publicUrl: 'https://bucket.s3.region.amazonaws.com/system-design/img-123/diagram.png',
      expiresIn: 3600,
    });

    await prepAdminApi.getSystemDesignUploadUrl('diagram.png', 'image/png');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.action).toBe('get_sd_media_upload_url');
    expect(body.filename).toBe('diagram.png');
    expect(body.contentType).toBe('image/png');
  });

  it('uses image/png as default contentType when not provided', async () => {
    mockSuccess({ success: true, uploadUrl: 'https://x.com', s3Key: 'k', publicUrl: 'p', expiresIn: 3600 });

    await prepAdminApi.getSystemDesignUploadUrl('arch.png');

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.contentType).toBe('image/png');
  });

  it('returns the upload URL payload on success', async () => {
    const payload = {
      success: true,
      uploadUrl: 'https://presigned.example.com/upload',
      s3Key: 'system-design/img-abc/banner.jpg',
      publicUrl: 'https://bucket.s3.region.amazonaws.com/system-design/img-abc/banner.jpg',
      expiresIn: 3600,
    };
    mockSuccess(payload);

    const result = await prepAdminApi.getSystemDesignUploadUrl('banner.jpg', 'image/jpeg');
    expect(result).toMatchObject({
      uploadUrl: payload.uploadUrl,
      s3Key: payload.s3Key,
      publicUrl: payload.publicUrl,
      expiresIn: 3600,
    });
  });

  it('returns null when the API responds with success: false', async () => {
    mockSuccess({ success: false, message: 'filename is required' });

    const result = await prepAdminApi.getSystemDesignUploadUrl('', 'image/png');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await prepAdminApi.getSystemDesignUploadUrl('arch.png', 'image/png');
    expect(result).toBeNull();
  });
});

describe('prepAdminApi.uploadSystemDesignMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls action upload_sd_media with base64 payload', async () => {
    mockSuccess({
      success: true,
      s3Key: 'system-design/images/sdm-abc/diagram.png',
      publicUrl: 'https://bucket.s3.region.amazonaws.com/system-design/images/sdm-abc/diagram.png',
    });

    await prepAdminApi.uploadSystemDesignMedia(
      'diagram.png',
      'image/png',
      'aGVsbG8=',
      'image',
    );

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.action).toBe('upload_sd_media');
    expect(body.filename).toBe('diagram.png');
    expect(body.contentType).toBe('image/png');
    expect(body.mediaKind).toBe('image');
    expect(body.fileBase64).toBe('aGVsbG8=');
  });

  it('returns publicUrl on success', async () => {
    mockSuccess({
      success: true,
      s3Key: 'system-design/pdfs/sdm-abc/guide.pdf',
      publicUrl: 'https://bucket.s3.region.amazonaws.com/system-design/pdfs/sdm-abc/guide.pdf',
    });

    const result = await prepAdminApi.uploadSystemDesignMedia(
      'guide.pdf',
      'application/pdf',
      'JVBERi0=',
      'pdf',
    );
    expect(result?.publicUrl).toContain('guide.pdf');
  });
});

describe('prepAdminApi.listContent contentKind filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes contentKind in list_content request body', async () => {
    mockSuccess({
      success: true,
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 200,
    });

    await prepAdminApi.listContent('system_design', {
      designType: 'hld',
      contentKind: 'concept',
      limit: 200,
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.action).toBe('list_content');
    expect(body.contentType).toBe('system_design');
    expect(body.designType).toBe('hld');
    expect(body.contentKind).toBe('concept');
  });
});
