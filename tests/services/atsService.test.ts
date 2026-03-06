import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLlmKeysStatus, getAtsScore, buildResumeTextFromInfo } from '../../services/atsService';
import type { ResumeInfo } from '../../context/ResumeInfoContext';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
  } as Response);

const sampleResumeInfo: ResumeInfo = {
  firstName: 'John',
  lastName: 'Doe',
  jobTitle: 'Software Developer',
  address: 'Bangalore, India',
  phone: '9876543210',
  email: 'john@example.com',
  linkedIn: 'linkedin.com/in/johndoe',
  github: 'github.com/johndoe',
  portfolio: 'johndoe.dev',
  themeColor: '#9f5bff',
  template: 'classic',
  summary: '<p>Experienced developer</p>',
  experience: [
    {
      id: 'exp1',
      title: 'Developer',
      companyName: 'Tech Corp',
      city: 'Bangalore',
      state: 'Karnataka',
      startDate: '2020-01',
      endDate: '2023-01',
      currentlyWorking: false,
      workSummary: '<p>Built features</p>',
    },
  ],
  education: [
    {
      id: 'edu1',
      universityName: 'IIT Bombay',
      degree: 'B.Tech',
      major: 'CS',
      startDate: '2016',
      endDate: '2020',
      description: 'Graduated with distinction',
    },
  ],
  skills: [{ name: 'React' }, { name: 'TypeScript' }],
  projects: [
    {
      id: 'proj1',
      name: 'My Project',
      description: 'A cool project',
      technologies: ['React', 'Node.js'],
    },
  ],
};

describe('atsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLlmKeysStatus', () => {
    it('returns key status on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          hasOpenAiKey: true,
          hasGeminiKey: false,
          hasClaudeKey: false,
          providers: [],
        })
      );
      const result = await getLlmKeysStatus('u1');
      expect(result.success).toBe(true);
      expect(result.hasOpenAiKey).toBe(true);
      expect(result.hasGeminiKey).toBe(false);
    });

    it('returns false flags when keys are absent', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, hasOpenAiKey: false, hasGeminiKey: false, hasClaudeKey: false })
      );
      const result = await getLlmKeysStatus('u1');
      expect(result.hasOpenAiKey).toBe(false);
    });
  });

  describe('getAtsScore', () => {
    it('returns ATS result on success', async () => {
      const atsResult = {
        overallScore: 78,
        breakdown: { skillsMatch: 80, experience: 75, education: 70, formatting: 90, achievements: 60 },
        matchedKeywords: ['React', 'TypeScript'],
        missingKeywords: ['Docker'],
        feedback: ['Add Docker experience'],
      };
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, atsResult }));
      const result = await getAtsScore('u1', 'John Doe React TypeScript', 'We need React TypeScript Docker developer');
      expect(result.success).toBe(true);
      expect(result.atsResult?.overallScore).toBe(78);
    });

    it('returns failure message on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, false));
      const result = await getAtsScore('u1', 'resume text', 'job desc');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('buildResumeTextFromInfo', () => {
    it('includes name and job title', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).toContain('John Doe');
      expect(text).toContain('Software Developer');
    });

    it('includes contact information', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).toContain('john@example.com');
      expect(text).toContain('9876543210');
    });

    it('includes experience section', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).toContain('EXPERIENCE');
      expect(text).toContain('Developer at Tech Corp');
    });

    it('includes education section', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).toContain('EDUCATION');
      expect(text).toContain('B.Tech in CS, IIT Bombay');
    });

    it('includes skills', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).toContain('SKILLS');
      expect(text).toContain('React');
      expect(text).toContain('TypeScript');
    });

    it('includes projects', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).toContain('PROJECTS');
      expect(text).toContain('My Project');
    });

    it('strips HTML tags from summary', () => {
      const text = buildResumeTextFromInfo(sampleResumeInfo);
      expect(text).not.toContain('<p>');
      expect(text).toContain('Experienced developer');
    });

    it('handles empty resume gracefully', () => {
      const emptyInfo: ResumeInfo = {
        firstName: 'Jane',
        lastName: 'Smith',
        jobTitle: '',
        address: '',
        phone: '',
        email: '',
        linkedIn: '',
        github: '',
        portfolio: '',
        themeColor: '#000000',
        template: 'classic',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
      };
      const text = buildResumeTextFromInfo(emptyInfo);
      expect(text).toContain('Jane Smith');
      expect(text).not.toContain('EXPERIENCE');
    });
  });
});
