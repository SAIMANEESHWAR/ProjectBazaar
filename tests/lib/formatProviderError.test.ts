import { describe, expect, it } from 'vitest';
import { formatProviderError } from '../../lib/formatProviderError';

describe('formatProviderError', () => {
  it('classifies OpenAI invalid API key JSON without exposing raw payload', () => {
    const raw =
      '{"error":{"message":"Incorrect API key provided","type":"invalid_request_error","code":"invalid_api_key"}}';
    const out = formatProviderError('openai', raw);
    expect(out.code).toBe('INVALID_API_KEY');
    expect(out.title).toBe('API Key Invalid or Expired');
    expect(out.description).not.toContain('{');
    expect(out.isProviderIssue).toBe(true);
    expect(out.helpUrl).toContain('openai.com');
  });

  it('classifies Gemini RESOURCE_EXHAUSTED as quota exceeded', () => {
    const raw =
      '{"error":{"code":429,"message":"You exceeded your current quota.","status":"RESOURCE_EXHAUSTED"}}';
    const out = formatProviderError('gemini', raw);
    expect(out.code).toBe('QUOTA_EXCEEDED');
    expect(out.title).toBe('Usage Limit Reached');
    expect(out.helpUrl).toContain('ai.google.dev');
    expect(out.description).toContain('Gemini');
  });

  it('classifies rate limit responses as retryable', () => {
    const raw = 'Rate limit exceeded for requests';
    const out = formatProviderError('openrouter', raw);
    expect(out.code).toBe('RATE_LIMIT');
    expect(out.retryable).toBe(true);
  });

  it('classifies bare Lambda validation failure messages', () => {
    const out = formatProviderError('gemini', 'API key validation failed');
    expect(out.code).toBe('INVALID_API_KEY');
    expect(out.title).toBe('API Key Invalid or Expired');
  });

  it('classifies wrapped Settings save validation messages with embedded JSON', () => {
    const raw =
      'Gemini API key validation failed. {"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}';
    const out = formatProviderError('gemini', raw);
    expect(out.code).toBe('INVALID_API_KEY');
    expect(out.isProviderIssue).toBe(true);
  });

  it('classifies ATS Lambda prefixed Gemini HTTP errors', () => {
    const raw =
      'Gemini API error (429): {"error":{"code":429,"message":"You exceeded your current quota.","status":"RESOURCE_EXHAUSTED"}}';
    const out = formatProviderError('gemini', raw);
    expect(out.code).toBe('QUOTA_EXCEEDED');
  });

  it('uses structured Lambda error without string parsing', () => {
    const out = formatProviderError('gemini', {
      code: 'INVALID_API_KEY',
      provider: 'gemini',
      message: 'API key not valid',
      retryable: false,
    });
    expect(out.code).toBe('INVALID_API_KEY');
    expect(out.title).toBe('API Key Invalid or Expired');
    expect(out.description).toContain('Google Gemini');
    expect(out.retryable).toBe(false);
  });

  it('keeps local validation messages human without provider footer', () => {
    const out = formatProviderError('openai', 'Enter your openai API key first.');
    expect(out.isProviderIssue).toBe(false);
    expect(out.description).toBe('Enter your openai API key first.');
  });
});
