// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ExitConfirmDialog } from '../ExitConfirmDialog';
import * as projectLib from '@/lib/project';

describe('ExitConfirmDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    items: [{ key: 'app.title', en: 'App', my: 'အက်ပ်' }],
    languages: ['en', 'my'],
    onConfirmExit: vi.fn(),
    defaultProjectName: 'my-mobile-app',
  };

  it('renders dialog with project filename input and choices', () => {
    render(<ExitConfirmDialog {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Save Project Before Leaving?' })).not.toBeNull();
    const input = screen.getByDisplayValue('my-mobile-app') as HTMLInputElement;
    expect(input).not.toBeNull();
  });

  it('calls exportProjectFile and onConfirmExit on save button click', async () => {
    const exportSpy = vi.spyOn(projectLib, 'exportProjectFile').mockResolvedValue(undefined);
    render(<ExitConfirmDialog {...baseProps} />);

    const saveBtn = screen.getByRole('button', { name: /Save \.jsonlink & Exit/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith('my-mobile-app', baseProps.items, baseProps.languages, undefined);
      expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(baseProps.onConfirmExit).toHaveBeenCalledTimes(1);
    });
    exportSpy.mockRestore();
  });

  it('calls onConfirmExit without exporting when discard button is clicked', () => {
    const exportSpy = vi.spyOn(projectLib, 'exportProjectFile');
    render(<ExitConfirmDialog {...baseProps} />);

    const discardBtn = screen.getByRole('button', { name: /Discard & Exit/i });
    fireEvent.click(discardBtn);

    expect(exportSpy).not.toHaveBeenCalled();
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(baseProps.onConfirmExit).toHaveBeenCalledTimes(1);
    exportSpy.mockRestore();
  });

  it('handles password protection toggle and passes password to exportProjectFile', async () => {
    const exportSpy = vi.spyOn(projectLib, 'exportProjectFile').mockResolvedValue(undefined);
    render(<ExitConfirmDialog {...baseProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /Protect with Password/i });
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox);

    // Save button should be disabled when password is empty
    const saveBtn = screen.getByRole('button', { name: /Save \.jsonlink & Exit/i });
    expect(saveBtn.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Password is required to encrypt this file/i)).not.toBeNull();

    // Fill in password
    const pwInput = screen.getByPlaceholderText(/Enter backup encryption password/i);
    fireEvent.change(pwInput, { target: { value: 'SecretExitPass123' } });

    // Strength meter should be displayed
    expect(screen.getByText(/Strength:/i)).not.toBeNull();

    // Still disabled without confirm password
    expect(saveBtn.hasAttribute('disabled')).toBe(true);

    // Mismatched confirm password shows error
    const confirmInput = screen.getByPlaceholderText(/Confirm backup password/i);
    fireEvent.change(confirmInput, { target: { value: 'WrongPass' } });
    expect(screen.getByText(/Passwords do not match/i)).not.toBeNull();
    expect(saveBtn.hasAttribute('disabled')).toBe(true);

    // Matching confirm password enables save
    fireEvent.change(confirmInput, { target: { value: 'SecretExitPass123' } });
    expect(saveBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(saveBtn);

    expect(exportSpy).toHaveBeenCalledWith('my-mobile-app', baseProps.items, baseProps.languages, 'SecretExitPass123');
    exportSpy.mockRestore();
  });
});
