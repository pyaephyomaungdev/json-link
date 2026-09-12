// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { SaveProjectModal } from '../SaveProjectModal';
import * as projectLib from '@/lib/project';

vi.mock('@/lib/project', () => ({
  exportProjectFile: vi.fn(),
  saveLocalDraft: vi.fn(),
}));

describe('SaveProjectModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    items: [
      { key: 'hello', en: 'Hello', my: 'မင်္ဂလာပါ' },
      { key: 'bye', en: 'Bye', my: 'နှုတ်ဆက်ပါတယ်' },
    ],
    languages: ['en', 'my'],
    defaultProjectName: 'my-app-i18n',
  };

  it('renders modal with summary and project name', () => {
    render(<SaveProjectModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Save Complete Project (.jsonlink)' })).not.toBeNull();
    expect(screen.getByText('Total Keys')).not.toBeNull();
    expect(screen.getByText('2 (en, my)')).not.toBeNull();

    const input = screen.getByPlaceholderText('translations-backup') as HTMLInputElement;
    expect(input.value).toBe('my-app-i18n');
  });

  it('calls exportProjectFile and saveLocalDraft on save', async () => {
    render(<SaveProjectModal {...defaultProps} />);
    const saveBtn = screen.getByRole('button', { name: /Save \.jsonlink File/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(projectLib.exportProjectFile).toHaveBeenCalledWith(
        'my-app-i18n',
        defaultProps.items,
        defaultProps.languages,
        undefined
      );
      expect(projectLib.saveLocalDraft).toHaveBeenCalledWith(
        'my-app-i18n',
        defaultProps.items,
        defaultProps.languages
      );
      expect(screen.getByText('Saved!')).not.toBeNull();
    });
  });

  it('cancels modal when Cancel button is clicked', () => {
    render(<SaveProjectModal {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks save when password is enabled but empty', () => {
    render(<SaveProjectModal {...defaultProps} />);
    const checkbox = screen.getByLabelText(/Protect with Password/i);
    fireEvent.click(checkbox);

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect(saveBtn).toHaveProperty('disabled', true);
    expect(screen.getByText(/Password is required to encrypt this file/i)).not.toBeNull();
  });
});
