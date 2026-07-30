import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { ErrorService } from '../../lib/errorService';

vi.mock('../../lib/errorService', () => ({
  ErrorService: {
    report: vi.fn(),
    reportAsync: vi.fn(),
  },
}));

function Bomb({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('Kaboom!');
  return <div>Safe content</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('crypto', {
    randomUUID: () => '00000000-0000-0000-0000-000000000000',
    getRandomValues: (arr: Uint32Array) => { arr[0] = 0; },
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Hello</div></ErrorBoundary>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('displays error ID', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>);
    expect(screen.getByText(/crash_00000000/)).toBeInTheDocument();
  });

  it('shows fallback with error details and reports to ErrorService', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Kaboom!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(ErrorService.report).toHaveBeenCalledWith('REACT_CRASH', 'Kaboom!', expect.any(Object), false);
  });

  it('re-catches if children still throw after Try Again click', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('calls onError prop when error occurs', () => {
    const onError = vi.fn();
    render(<ErrorBoundary onError={onError}><Bomb shouldThrow /></ErrorBoundary>);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({
      componentStack: expect.any(String),
    }));
  });

  it('includes error message and ID in fallback', () => {
    const { container } = render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>);
    expect(container.textContent).toContain('Kaboom!');
    expect(container.textContent).toContain('crash_');
  });
});
