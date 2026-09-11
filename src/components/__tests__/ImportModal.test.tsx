// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ImportModal } from '../ImportModal';

describe('ImportModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    currentItems: [{ key: 'hello', en: 'Hello' }],
    currentLanguages: ['en'],
    onImportComplete: vi.fn(),
  };

  it('renders dropzone and format hints correctly', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Import Translations' })).not.toBeNull();
    expect(screen.getByText('Click to browse or drop your translation files here')).not.toBeNull();
    expect(screen.getByText('.jsonlink')).not.toBeNull();
  });

  it('handles uploading a JSON file and completes import', async () => {
    render(<ImportModal {...defaultProps} />);

    const fileContent = JSON.stringify({
      auth: {
        login: 'Sign in to account',
      },
    });
    const file = new File([fileContent], 'en.json', { type: 'application/json' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('en.json')).not.toBeNull();
    });

    // Test import mode toggle
    const replaceModeBtn = screen.getByRole('button', { name: /Replace All Data/i });
    fireEvent.click(replaceModeBtn);

    const applyBtn = screen.getByRole('button', { name: /Apply Import/i });
    fireEvent.click(applyBtn);

    expect(defaultProps.onImportComplete).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when cancel button is clicked', () => {
    render(<ImportModal {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
