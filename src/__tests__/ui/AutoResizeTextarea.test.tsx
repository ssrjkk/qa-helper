import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoResizeTextarea } from '../../components/ui/AutoResizeTextarea';

describe('AutoResizeTextarea', () => {
  it('renders with value', () => {
    render(<AutoResizeTextarea value="hello" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('hello');
  });

  it('fires onChange when typing', () => {
    const onChange = vi.fn();
    render(<AutoResizeTextarea value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('renders placeholder text', () => {
    render(<AutoResizeTextarea value="" onChange={vi.fn()} placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('shows character count when maxLength is set', () => {
    render(<AutoResizeTextarea value="abc" onChange={vi.fn()} maxLength={10} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('does not show character count without maxLength', () => {
    render(<AutoResizeTextarea value="abc" onChange={vi.fn()} />);
    expect(screen.queryByText('3/')).not.toBeInTheDocument();
  });

  it('uses aria-label when provided', () => {
    render(<AutoResizeTextarea value="" onChange={vi.fn()} aria-label="My textarea" />);
    expect(screen.getByLabelText('My textarea')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<AutoResizeTextarea value="" onChange={vi.fn()} className="custom-class" />);
    expect(container.querySelector('textarea')).toHaveClass('custom-class');
  });
});
