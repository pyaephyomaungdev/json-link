// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Toolbar } from '../Toolbar';

const baseProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  selectedNamespace: 'all',
  onNamespaceChange: vi.fn(),
  namespaces: [],
  activeFilter: 'all' as const,
  onFilterChange: vi.fn(),
  onOpenAddKey: vi.fn(),
  onOpenAddLanguage: vi.fn(),
  onOpenImport: vi.fn(),
  onOpenExport: vi.fn(),
  onResetToSample: vi.fn(),
  onClearAll: vi.fn(),
  hasItems: true,
};

describe('Toolbar search debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.clearAllMocks();
  });

  it('updates local input immediately but debounces onSearchChange by 150ms', () => {
    render(<Toolbar {...baseProps} />);
    const input = screen.getByPlaceholderText('Search keys...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'log' } });

    // Input value reflects instantly (zero-latency typing)
    expect(input.value).toBe('log');
    // Parent not yet notified inside the debounce window
    expect(baseProps.onSearchChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(149);
    expect(baseProps.onSearchChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(baseProps.onSearchChange).toHaveBeenCalledTimes(1);
    expect(baseProps.onSearchChange).toHaveBeenCalledWith('log');
  });

  it('collapses rapid keystrokes into a single debounced call with the latest value', () => {
    render(<Toolbar {...baseProps} />);
    const input = screen.getByPlaceholderText('Search keys...');

    fireEvent.change(input, { target: { value: 'l' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'lo' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'log' } });
    vi.advanceTimersByTime(150);

    expect(baseProps.onSearchChange).toHaveBeenCalledTimes(1);
    expect(baseProps.onSearchChange).toHaveBeenCalledWith('log');
  });

  it('clear button fires onSearchChange immediately without waiting for the debounce', () => {
    const { container } = render(<Toolbar {...baseProps} />);
    const input = screen.getByPlaceholderText('Search keys...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc' } });
    vi.advanceTimersByTime(150);
    expect(baseProps.onSearchChange).toHaveBeenCalledTimes(1);

    const clearButton = container.querySelector('button.absolute.right-1\\.5');
    expect(clearButton).not.toBeNull();
    fireEvent.click(clearButton!);

    expect(input.value).toBe('');
    expect(baseProps.onSearchChange).toHaveBeenCalledWith('');
    // Pending debounce from earlier typing must not fire again afterwards
    vi.advanceTimersByTime(500);
    expect(baseProps.onSearchChange).toHaveBeenCalledTimes(2);
  });

  it('does not call onSearchChange after unmount with a pending debounce', () => {
    const { unmount } = render(<Toolbar {...baseProps} />);
    const input = screen.getByPlaceholderText('Search keys...');

    fireEvent.change(input, { target: { value: 'pending' } });
    unmount();

    vi.advanceTimersByTime(1000);
    expect(baseProps.onSearchChange).not.toHaveBeenCalled();
  });

  it('resets its local input when the parent searchQuery changes externally', () => {
    const { rerender } = render(<Toolbar {...baseProps} />);
    rerender(<Toolbar {...baseProps} searchQuery="from-parent" />);

    const input = screen.getByPlaceholderText('Search keys...') as HTMLInputElement;
    expect(input.value).toBe('from-parent');
  });

  it('keeps Add Language button enabled when hasItems is false for empty sheet workflow', () => {
    render(<Toolbar {...baseProps} hasItems={false} />);
    const langBtn = screen.getByRole('button', { name: 'Lang' });
    expect(langBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(langBtn);
    expect(baseProps.onOpenAddLanguage).toHaveBeenCalled();
  });

  it('renders responsive More menu button for compact screen reachability', () => {
    render(<Toolbar {...baseProps} />);
    const moreBtn = screen.getByRole('button', { name: 'More' });
    expect(moreBtn).not.toBeNull();
  });
});
