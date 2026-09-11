// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AddKeyDialog } from '../AddKeyDialog';

describe('AddKeyDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    languages: ['en', 'my'],
    onAddKey: vi.fn(),
    existingKeys: ['existing.key'],
  };

  it('renders form inputs for key name, description, and languages when open', () => {
    render(<AddKeyDialog {...baseProps} />);
    expect(screen.getByPlaceholderText('e.g. actionConfirm, auth.welcome')).not.toBeNull();
    expect(screen.getByPlaceholderText('e.g. Shown on navbar header, translator note')).not.toBeNull();
    expect(screen.getByPlaceholderText('Enter EN text...')).not.toBeNull();
    expect(screen.getByPlaceholderText('Enter MY text...')).not.toBeNull();
  });

  it('shows validation error if key name is empty on submit', () => {
    render(<AddKeyDialog {...baseProps} />);
    const submitBtn = screen.getByRole('button', { name: 'Add Key' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Key name cannot be empty.')).not.toBeNull();
    expect(baseProps.onAddKey).not.toHaveBeenCalled();
  });

  it('shows validation error if key name already exists', () => {
    render(<AddKeyDialog {...baseProps} />);
    const keyInput = screen.getByPlaceholderText('e.g. actionConfirm, auth.welcome');
    fireEvent.change(keyInput, { target: { value: 'existing.key' } });

    const submitBtn = screen.getByRole('button', { name: 'Add Key' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('The key "existing.key" already exists in the translations.')).not.toBeNull();
    expect(baseProps.onAddKey).not.toHaveBeenCalled();
  });

  it('calls onAddKey with trimmed key, values, description, and closes dialog on success', () => {
    render(<AddKeyDialog {...baseProps} />);
    const keyInput = screen.getByPlaceholderText('e.g. actionConfirm, auth.welcome');
    const descInput = screen.getByPlaceholderText('e.g. Shown on navbar header, translator note');
    const enInput = screen.getByPlaceholderText('Enter EN text...');
    const myInput = screen.getByPlaceholderText('Enter MY text...');

    fireEvent.change(keyInput, { target: { value: '  new.action.btn  ' } });
    fireEvent.change(descInput, { target: { value: 'Button context' } });
    fireEvent.change(enInput, { target: { value: 'Click Me' } });
    fireEvent.change(myInput, { target: { value: 'နှိပ်ပါ' } });

    const submitBtn = screen.getByRole('button', { name: 'Add Key' });
    fireEvent.click(submitBtn);

    expect(baseProps.onAddKey).toHaveBeenCalledTimes(1);
    expect(baseProps.onAddKey).toHaveBeenCalledWith(
      'new.action.btn',
      { en: 'Click Me', my: 'နှိပ်ပါ' },
      'Button context'
    );
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
