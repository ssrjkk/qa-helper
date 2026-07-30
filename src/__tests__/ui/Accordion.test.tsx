import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion } from '../../components/ui/Accordion';

describe('Accordion', () => {
  it('renders title and icon', () => {
    render(<Accordion icon="🚀" title="Test Title">Content</Accordion>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('shows content on second render after click', () => {
    render(<Accordion icon="🚀" title="Toggle">Hidden Content</Accordion>);
    const btn = screen.getByText('Toggle').closest('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn!);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts open when defaultOpen is true', () => {
    render(<Accordion icon="🚀" title="Pre-opened" defaultOpen={true}>Visible</Accordion>);
    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Accordion icon="🚀" title="Title" subtitle="Sub">Body</Accordion>);
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    render(<Accordion icon="🚀" title="Title" badge={5}>Body</Accordion>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('toggles aria-expanded on click', () => {
    render(<Accordion icon="🚀" title="Toggle">Content</Accordion>);
    const btn = screen.getByText('Toggle').closest('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn!);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
