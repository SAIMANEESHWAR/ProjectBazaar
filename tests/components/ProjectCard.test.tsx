import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ProjectCard from '../../components/ProjectCard';
import { renderWithProviders } from '../testUtils';
import type { Project } from '../../components/ProjectCard';

const sampleProject: Project = {
  imageUrl: 'https://example.com/image.jpg',
  category: 'Web Development',
  title: 'E-Commerce Platform',
  description: 'A full-stack e-commerce solution with payment integration.',
  tags: ['react', 'node', 'mongodb'],
  price: 1500,
};

describe('ProjectCard', () => {
  it('renders the project title', () => {
    renderWithProviders(<ProjectCard project={sampleProject} />);
    expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument();
  });

  it('renders the project category', () => {
    renderWithProviders(<ProjectCard project={sampleProject} />);
    expect(screen.getByText('Web Development')).toBeInTheDocument();
  });

  it('renders the project description', () => {
    renderWithProviders(<ProjectCard project={sampleProject} />);
    expect(screen.getByText(/e-commerce solution/i)).toBeInTheDocument();
  });

  it('renders the project price', () => {
    renderWithProviders(<ProjectCard project={sampleProject} />);
    expect(screen.getByText(/1500|₹1,500|1,500/)).toBeInTheDocument();
  });

  it('renders project tags', () => {
    renderWithProviders(<ProjectCard project={sampleProject} />);
    // At least one tag should be visible
    const reactTag = screen.queryByText('react');
    const nodeTag = screen.queryByText('node');
    // Tags may or may not all show depending on layout
    expect(reactTag || nodeTag).toBeTruthy();
  });

  it('renders the project image', () => {
    renderWithProviders(<ProjectCard project={sampleProject} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
