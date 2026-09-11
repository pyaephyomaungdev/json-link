// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmDialog, ConfirmDialogConfig } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing when config is null', () => {
    const { container } = render(<ConfirmDialog config={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog title and description when open', () => {
    const config: ConfirmDialogConfig = {
      isOpen: true,
      title: 'Delete Key?',
      description: 'Are you sure you want to delete this translation key?',
      onConfirm: vi.fn(),
    };

    render(<ConfirmDialog config={config} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Delete Key?' })).not.toBeNull();
    expect(
      screen.getAllByText('Are you sure you want to delete this translation key?').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('triggers onConfirm and onClose when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const config: ConfirmDialogConfig = {
      isOpen: true,
      title: 'Confirm Action',
      description: 'Test description',
      confirmLabel: 'Yes, Delete',
      onConfirm,
    };

    render(<ConfirmDialog config={config} onClose={onClose} />);
    const confirmBtn = screen.getByRole('button', { name: 'Yes, Delete' });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onCancel and onClose when cancel button is clicked', () => {
    const onCancel = vi.fn();
    const onClose = vi.fn();
    const config: ConfirmDialogConfig = {
      isOpen: true,
      title: 'Confirm Action',
      description: 'Test description',
      cancelLabel: 'Keep it',
      onConfirm: vi.fn(),
      onCancel,
    };

    render(<ConfirmDialog config={config} onClose={onClose} />);
    const cancelBtn = screen.getByRole('button', { name: 'Keep it' });
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders alert mode with only one acknowledge button when isAlert is true', () => {
    const config: ConfirmDialogConfig = {
      isOpen: true,
      title: 'Duplicate Key',
      description: 'Key already exists',
      isAlert: true,
      confirmLabel: 'Understood',
      onConfirm: vi.fn(),
    };

    render(<ConfirmDialog config={config} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Understood' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });
});
