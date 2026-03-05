import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import CoverageReportPage from '../../../components/admin/CoverageReportPage';
import { renderWithProviders } from '../../testUtils';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);

const sampleCoverageData = {
  total: {
    lines: { total: 500, covered: 400, skipped: 0, pct: 80.0 },
    branches: { total: 200, covered: 140, skipped: 0, pct: 70.0 },
    functions: { total: 100, covered: 85, skipped: 0, pct: 85.0 },
    statements: { total: 600, covered: 480, skipped: 0, pct: 80.0 },
  },
  'services/buyerApi.ts': {
    lines: { total: 150, covered: 110, skipped: 0, pct: 73.3 },
    branches: { total: 60, covered: 38, skipped: 0, pct: 63.3 },
    functions: { total: 20, covered: 18, skipped: 0, pct: 90.0 },
    statements: { total: 180, covered: 130, skipped: 0, pct: 72.2 },
  },
  'components/ProjectCard.tsx': {
    lines: { total: 40, covered: 38, skipped: 0, pct: 95.0 },
    branches: { total: 10, covered: 8, skipped: 0, pct: 80.0 },
    functions: { total: 5, covered: 5, skipped: 0, pct: 100.0 },
    statements: { total: 45, covered: 43, skipped: 0, pct: 95.6 },
  },
};

describe('CoverageReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching', () => {
      // Return a never-resolving promise to keep it in loading state
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      renderWithProviders(<CoverageReportPage />);
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('empty / error state', () => {
    it('shows empty state when coverage file returns 404', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, false, 404));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('shows instruction to run test:coverage command', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, false, 404));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByText(/npm run test:coverage/i)).toBeInTheDocument();
      });
    });

    it('shows retry button in empty state', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, false, 404));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        const retryBtn = screen.getByTestId('refresh-button');
        expect(retryBtn).toBeInTheDocument();
      });
    });

    it('shows empty state on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('summary metric cards', () => {
    it('renders four metric cards on success', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByTestId('metric-cards')).toBeInTheDocument();
      });
      expect(screen.getByText('Lines')).toBeInTheDocument();
      expect(screen.getByText('Branches')).toBeInTheDocument();
      expect(screen.getByText('Functions')).toBeInTheDocument();
      expect(screen.getByText('Statements')).toBeInTheDocument();
    });

    it('displays correct percentage values', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        // Both Lines and Statements are 80.0%, so multiple matches are expected
        const pctElements = screen.getAllByText('80.0%');
        expect(pctElements.length).toBeGreaterThan(0);
      });
    });

    it('shows green color for coverage >= 80%', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        const greenPcts = document.querySelectorAll('.text-green-600, .text-green-400');
        expect(greenPcts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('per-file breakdown table', () => {
    it('renders file table with file entries', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByTestId('file-table')).toBeInTheDocument();
      });
    });

    it('shows file names in table', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        // Files should appear (possibly truncated)
        const table = screen.getByTestId('file-table');
        expect(table.textContent).toContain('buyerApi');
      });
    });

    it('shows column headers for coverage metrics', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByText(/Lines %/i)).toBeInTheDocument();
        expect(screen.getByText(/Branches %/i)).toBeInTheDocument();
        expect(screen.getByText(/Functions %/i)).toBeInTheDocument();
        expect(screen.getByText(/Statements %/i)).toBeInTheDocument();
      });
    });
  });

  describe('refresh button', () => {
    it('renders refresh button', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(sampleCoverageData));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
    });

    it('re-fetches coverage data when refresh is clicked', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse(sampleCoverageData))
        .mockResolvedValueOnce(mockResponse(sampleCoverageData));

      renderWithProviders(<CoverageReportPage />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('refresh-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('last updated timestamp', () => {
    it('shows last updated when timestamp is in meta', async () => {
      const dataWithMeta = {
        ...sampleCoverageData,
        meta: {
          timestamp: '2024-01-15T10:30:00Z',
          passedTests: 172,
          failedTests: 0,
          skippedTests: 2,
        },
      };
      mockFetch.mockResolvedValueOnce(mockResponse(dataWithMeta));
      renderWithProviders(<CoverageReportPage />);
      await waitFor(() => {
        expect(screen.getByTestId('last-updated')).toBeInTheDocument();
        expect(screen.getByTestId('last-updated').textContent).toContain('Last updated');
      });
    });
  });
});
