// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GitHubSyncModal } from '../GitHubSyncModal';
import { TranslationItem } from '@/types';

describe('GitHubSyncModal', () => {
  const mockItems: TranslationItem[] = [
    { key: 'app.title', en: 'JSON Link', my: 'ဂျေဆွန် လင့်ခ်' },
    { key: 'app.desc', en: 'Localization spreadsheet', my: 'ဘာသာပြန်စပရက်ရှီး' },
  ];
  const mockLanguages = ['en', 'my'];
  const mockOnClose = vi.fn();
  const mockOnImportTranslations = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal with title, security shield, and connection inputs when open', () => {
    render(
      <GitHubSyncModal
        isOpen={true}
        onClose={mockOnClose}
        items={mockItems}
        languages={mockLanguages}
        onImportTranslations={mockOnImportTranslations}
      />
    );

    expect(screen.getByText('GitHub Localization Sync & PR')).not.toBeNull();
    expect(screen.getByText('Locales-Only Lock')).not.toBeNull();
    expect(screen.getByText(/Strict Locales-Only Safety Guard/i)).not.toBeNull();
    expect(screen.getByPlaceholderText(/owner\/repo/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /Connect & Scan Locales/i })).not.toBeNull();
  });

  it('allows user to type GitHub token and repo input', () => {
    render(
      <GitHubSyncModal
        isOpen={true}
        onClose={mockOnClose}
        items={mockItems}
        languages={mockLanguages}
        onImportTranslations={mockOnImportTranslations}
      />
    );

    const repoInput = screen.getByPlaceholderText(/owner\/repo/i) as HTMLInputElement;
    fireEvent.change(repoInput, { target: { value: 'pyaephyomaungdev/json-link' } });
    expect(repoInput.value).toBe('pyaephyomaungdev/json-link');

    const tokenInput = screen.getByPlaceholderText(/ghp_xxxx/i) as HTMLInputElement;
    fireEvent.change(tokenInput, { target: { value: 'ghp_mocktoken123456789' } });
    expect(tokenInput.value).toBe('ghp_mocktoken123456789');
  });

  it('validates repository format before connecting', async () => {
    render(
      <GitHubSyncModal
        isOpen={true}
        onClose={mockOnClose}
        items={mockItems}
        languages={mockLanguages}
        onImportTranslations={mockOnImportTranslations}
      />
    );

    const tokenInput = screen.getByPlaceholderText(/ghp_xxxx/i);
    fireEvent.change(tokenInput, { target: { value: 'ghp_mocktoken123456789' } });

    const repoInput = screen.getByPlaceholderText(/owner\/repo/i);
    fireEvent.change(repoInput, { target: { value: 'invalid-repo-without-slash' } });

    const connectBtn = screen.getByRole('button', { name: /Connect & Scan Locales/i });
    fireEvent.click(connectBtn);

    const errorMsg = await screen.findByText(/Please enter a valid repository format/i);
    expect(errorMsg).not.toBeNull();
  });

  it('calls onClose when Close button is clicked', () => {
    render(
      <GitHubSyncModal
        isOpen={true}
        onClose={mockOnClose}
        items={mockItems}
        languages={mockLanguages}
        onImportTranslations={mockOnImportTranslations}
      />
    );

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
