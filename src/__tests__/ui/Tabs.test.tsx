import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabPanel } from '../../components/ui/Tabs';

const tabs = [
  { id: 'a', label: 'Tab A' },
  { id: 'b', label: 'Tab B', badge: 3 },
  { id: 'c', label: 'Tab C', icon: '⚙️' },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getByText('Tab A')).toBeInTheDocument();
    expect(screen.getByText('Tab B')).toBeInTheDocument();
    expect(screen.getByText('Tab C')).toBeInTheDocument();
  });

  it('sets aria-selected on active tab', () => {
    render(<Tabs tabs={tabs} activeTab="b" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('tab');
    expect(buttons[0]).toHaveAttribute('aria-selected', 'false');
    expect(buttons[1]).toHaveAttribute('aria-selected', 'true');
    expect(buttons[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange on tab click', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Tab B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('navigates with ArrowRight', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="a" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('navigates with ArrowLeft', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="b" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('wraps around with ArrowRight at end', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="c" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('navigates to first tab with Home', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="c" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('navigates to last tab with End', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="a" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('displays badge', () => {
    render(<Tabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has tablist role', () => {
    render(<Tabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});

describe('TabPanel', () => {
  it('renders content when active', () => {
    render(
      <Tabs tabs={tabs} activeTab="a" onChange={vi.fn()}>
        <TabPanel tabId="a" activeTab="a">Panel A</TabPanel>
      </Tabs>
    );
    expect(screen.getByText('Panel A')).toBeInTheDocument();
  });

  it('hides content when not active', () => {
    render(
      <Tabs tabs={tabs} activeTab="b" onChange={vi.fn()}>
        <TabPanel tabId="a" activeTab="b">Panel A</TabPanel>
      </Tabs>
    );
    expect(screen.queryByText('Panel A')).not.toBeInTheDocument();
  });

  it('has tabpanel role', () => {
    render(
      <Tabs tabs={tabs} activeTab="a" onChange={vi.fn()}>
        <TabPanel tabId="a" activeTab="a">Content</TabPanel>
      </Tabs>
    );
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});
