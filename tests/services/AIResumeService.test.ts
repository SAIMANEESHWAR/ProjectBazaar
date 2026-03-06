import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIResumeService, {
  generateSummarySuggestions,
  generateExperienceBullets,
  generateSkillsSuggestions,
} from '../../services/AIResumeService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AIResumeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSummarySuggestions', () => {
    it('returns 3 template-based summaries when no AI key configured', async () => {
      // No AI key configured in test env, falls back to templates
      const results = await generateSummarySuggestions('Software Developer');
      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('summary');
      expect(results[0]).toHaveProperty('experience_level');
    });

    it('returns summaries for different experience levels', async () => {
      const results = await generateSummarySuggestions('Frontend Developer');
      const levels = results.map(r => r.experience_level);
      expect(levels).toContain('Fresher');
      expect(levels).toContain('Mid-Level');
      expect(levels).toContain('Senior');
    });

    it('summaries contain job title', async () => {
      const results = await generateSummarySuggestions('Data Scientist');
      const allSummaries = results.map(r => r.summary).join(' ');
      expect(allSummaries.toLowerCase()).toContain('data scientist');
    });

    it('handles fallback when AI API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });
      const results = await generateSummarySuggestions('Backend Developer');
      expect(results).toHaveLength(3);
    });
  });

  describe('generateExperienceBullets', () => {
    it('returns bullet points for known position titles', async () => {
      const result = await generateExperienceBullets('frontend developer');
      expect(result.bullets).toBeDefined();
      expect(result.bullets.length).toBeGreaterThan(0);
    });

    it('returns default bullets for unknown position', async () => {
      const result = await generateExperienceBullets('Unicorn Wrangler');
      expect(result.bullets).toBeDefined();
      expect(result.bullets.length).toBeGreaterThan(0);
    });

    it('returns software developer bullets for that title', async () => {
      const result = await generateExperienceBullets('software developer');
      const joined = result.bullets.join(' ');
      expect(joined.length).toBeGreaterThan(50);
    });

    it('handles AI API failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await generateExperienceBullets('backend developer');
      expect(result.bullets).toBeDefined();
      expect(result.bullets.length).toBeGreaterThan(0);
    });
  });

  describe('generateSkillsSuggestions', () => {
    it('returns relevant skills for developer role', async () => {
      const skills = await generateSkillsSuggestions('frontend developer');
      expect(skills).toContain('React');
    });

    it('returns relevant skills for backend role', async () => {
      const skills = await generateSkillsSuggestions('backend developer');
      expect(skills).toContain('Node.js');
    });

    it('returns relevant skills for data role', async () => {
      const skills = await generateSkillsSuggestions('data scientist');
      expect(skills).toContain('Python');
    });

    it('returns default skills for unknown role', async () => {
      const skills = await generateSkillsSuggestions('Astrophysicist');
      expect(skills).toContain('Communication');
    });

    it('returns an array', async () => {
      const skills = await generateSkillsSuggestions('product manager');
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe('default export', () => {
    it('exports all three functions', () => {
      expect(typeof AIResumeService.generateSummarySuggestions).toBe('function');
      expect(typeof AIResumeService.generateExperienceBullets).toBe('function');
      expect(typeof AIResumeService.generateSkillsSuggestions).toBe('function');
    });
  });
});
