import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SDDetailPanel } from '../../components/preparation/PrepSystemDesignPage';

vi.mock('../../components/preparation/SDDiagramRenderer', () => ({
  default: ({ data }: { data: { subtitle?: string } }) => (
    <div data-testid="sd-diagram-renderer">{data.subtitle ?? 'diagram-rendered'}</div>
  ),
}));

describe('SDDetailPanel', () => {
  const baseQuestion = {
    id: 'sd-1',
    title: 'Design a URL shortener',
    description: 'Build a scalable URL shortener service.',
    section: 'Scalability',
    difficulty: 'Medium' as const,
    designType: 'hld',
    topics: ['Caching', 'Database'],
  };

  it('renders solution content by default when only solution exists', () => {
    render(
      <SDDetailPanel
        q={{
          ...baseQuestion,
          content: 'Solution: (1) Generate keys (2) Store mappings',
        }}
      />
    );

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Build a scalable URL shortener service.')).toBeInTheDocument();
    expect(screen.getByText('Generate keys')).toBeInTheDocument();
    expect(screen.getByText('Store mappings')).toBeInTheDocument();
  });

  it('renders diagram tab when diagramUrl is available and switches to it', () => {
    render(
      <SDDetailPanel
        q={{
          ...baseQuestion,
          content: 'Solution: use load balancers',
          diagramUrl: 'https://cdn.example.com/diagram.png',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Diagram' }));
    expect(screen.getByAltText('Architecture diagram')).toBeInTheDocument();
  });

  it('renders interactive diagram when diagramData is provided', () => {
    render(
      <SDDetailPanel
        q={{
          ...baseQuestion,
          diagramData: {
            nodes: [{ id: '1', label: 'Client', x: 100, y: 100, w: 120, h: 48, fill: '#111827' }],
            edges: [],
            legend: [],
            subtitle: 'Architecture',
          },
        }}
      />
    );

    expect(screen.getByTestId('sd-diagram-renderer')).toHaveTextContent('Architecture');
  });

  it('renders images tab and shows uploaded images', () => {
    render(
      <SDDetailPanel
        q={{
          ...baseQuestion,
          content: 'Solution text',
          additionalImageUrls: [
            'https://cdn.example.com/one.png',
            'https://cdn.example.com/two.png',
          ],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Images (2)' }));
    expect(screen.getByAltText('Additional image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Additional image 2')).toBeInTheDocument();
  });

  it('falls back to embedded diagram data from legacy content', () => {
    const embedded = '__DIAGRAM_DATA_START__{"nodes":[{"id":"1","label":"Gateway","x":120,"y":80,"w":140,"h":48,"fill":"#111827"}],"edges":[],"legend":[],"subtitle":"Legacy Diagram"}__DIAGRAM_DATA_END__';
    render(
      <SDDetailPanel
        q={{
          ...baseQuestion,
          content: `Solution: legacy support\n${embedded}`,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Diagram' }));
    expect(screen.getByTestId('sd-diagram-renderer')).toHaveTextContent('Legacy Diagram');
  });
});
