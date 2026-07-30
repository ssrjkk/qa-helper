import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../../components/ui/CommandPalette';

const mockCommands = [
  { id: '1', label: 'New Project', category: 'Project', action: vi.fn() },
  { id: '2', label: 'Save', description: 'Save current work', category: 'File', action: vi.fn() },
  { id: '3', label: 'Export', category: 'File', action: vi.fn() },
];

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CommandPalette commands={mockCommands} open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all commands when open', () => {
    render(<CommandPalette commands={mockCommands} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('filters commands by query', () => {
    render(<CommandPalette commands={mockCommands} open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.change(input, { target: { value: 'save' } });
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('shows empty state when no match', () => {
    render(<CommandPalette commands={mockCommands} open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('executes command on click and closes', () => {
    const onClose = vi.fn();
    render(<CommandPalette commands={mockCommands} open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('New Project'));
    expect(mockCommands[0]?.action).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('navigates with arrow keys and selects with Enter', () => {
    render(<CommandPalette commands={mockCommands} open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockCommands[2]?.action).toHaveBeenCalledOnce();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette commands={mockCommands} open={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
