// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AddLanguageDialog } from '../AddLanguageDialog';

describe('AddLanguageDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    existingLanguages: ['en', 'my'],
    onAddLanguage: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<AddLanguageDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Add New Language Column' })).not.toBeNull();
    expect(screen.getByText('Or quick-add popular languages:')).not.toBeNull();
  });

  it('adds a quick language when clicked', () => {
    render(<AddLanguageDialog {...defaultProps} />);
    // Thai is in quick languages and not in existingLanguages
    const thaiBtn = screen.getByRole('button', { name: /Thai/i });
    fireEvent.click(thaiBtn);

    expect(defaultProps.onAddLanguage).toHaveBeenCalledWith('th');
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('switches to custom code mode and submits custom language', () => {
    render(<AddLanguageDialog {...defaultProps} />);
    const customToggle = screen.getByRole('button', { name: /Enter Custom Code/i });
    fireEvent.click(customToggle);

    const input = screen.getByPlaceholderText('e.g. th, ja, ko, fr, de, my...');
    fireEvent.change(input, { target: { value: 'pt' } });

    const addBtn = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(addBtn);

    expect(defaultProps.onAddLanguage).toHaveBeenCalledWith('pt');
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error when attempting to add an already existing language', () => {
    render(<AddLanguageDialog {...defaultProps} />);
    const customToggle = screen.getByRole('button', { name: /Enter Custom Code/i });
    fireEvent.click(customToggle);

    const input = screen.getByPlaceholderText('e.g. th, ja, ko, fr, de, my...');
    fireEvent.change(input, { target: { value: 'en' } });

    const addBtn = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(addBtn);

    expect(defaultProps.onAddLanguage).not.toHaveBeenCalled();
    expect(screen.getByText(/Language "EN" is already added/i)).not.toBeNull();
  });
});
