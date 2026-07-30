import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/ui/Toast';

function TestHarness() {
  const { addToast } = useToast();
  return <button onClick={() => addToast('Test message', 'success')}>Add Toast</button>;
}

describe('Toast system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows toast when addToast is called', () => {
    render(<ToastProvider><TestHarness /></ToastProvider>);
    fireEvent.click(screen.getByText('Add Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('dismisses toast on close button click', () => {
    render(<ToastProvider><TestHarness /></ToastProvider>);
    fireEvent.click(screen.getByText('Add Toast'));
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after timeout', () => {
    render(<ToastProvider><TestHarness /></ToastProvider>);
    fireEvent.click(screen.getByText('Add Toast'));
    act(() => { vi.runAllTimers(); });
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('has aria-live region for accessibility', () => {
    render(<ToastProvider><TestHarness /></ToastProvider>);
    expect(screen.getByLabelText('Notifications')).toHaveAttribute('aria-live', 'polite');
  });
});
