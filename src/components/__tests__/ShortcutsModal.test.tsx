// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ShortcutsModal } from '../ShortcutsModal';

describe('ShortcutsModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders modal with cheat sheet categories and items', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: /Keyboard Shortcuts/i })).not.toBeNull();
    expect(screen.getByText('General')).not.toBeNull();
    expect(screen.getByText('Grid & Editing')).not.toBeNull();
    expect(screen.getByText('History')).not.toBeNull();
    expect(screen.getByText('Collaboration')).not.toBeNull();

    expect(screen.getByText('Open Command Palette')).not.toBeNull();
    expect(screen.getByText('Undo last change')).not.toBeNull();
  });

  it('filters shortcuts when typing in search input', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    const searchInput = screen.getByPlaceholderText(/Search shortcuts/i);
    fireEvent.change(searchInput, { target: { value: 'undo' } });

    expect(screen.getByText('Undo last change')).not.toBeNull();
    expect(screen.queryByText('Open Command Palette')).toBeNull();
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    const closeBtns = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeBtns[0]);

    expect(onClose).toHaveBeenCalled();
  });
});
