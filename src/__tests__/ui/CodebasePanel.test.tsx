import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodebasePanel } from '../../components/panels/CodebasePanel';

vi.mock('../../lib/ErrorService', () => ({ ErrorService: { report: vi.fn() } }));

vi.mock('../../lib/workers/zipParser', () => ({
  zipParser: { init: vi.fn(), parseZip: vi.fn() },
}));

describe('CodebasePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders GitHub connect button when not connected', () => {
    render(<CodebasePanel provider={null} onConnect={vi.fn()} onDisconnect={vi.fn()} />);
    expect(screen.getByText(/github/i)).toBeInTheDocument();
  });

  it('renders local files button', () => {
    render(<CodebasePanel provider={null} onConnect={vi.fn()} onDisconnect={vi.fn()} />);
    expect(screen.getByText('Local Files')).toBeInTheDocument();
  });
});
