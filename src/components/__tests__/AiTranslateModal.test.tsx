// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AiTranslateModal } from '../AiTranslateModal';
import * as openrouterLib from '@/lib/openrouter';

vi.mock('@/lib/openrouter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openrouter')>();
  return {
    ...actual,
    testOpenRouterKey: vi.fn().mockResolvedValue({ valid: true }),
    translateBatchWithOpenRouter: vi.fn().mockResolvedValue({
      'auth.login': 'အကောင့်ဝင်ပါ',
    }),
    getStoredApiKey: vi.fn().mockResolvedValue(''),
    setStoredApiKey: vi.fn().mockResolvedValue(undefined),
    clearStoredApiKey: vi.fn().mockResolvedValue(undefined),
    isKeyRemembered: vi.fn(() => false),
    getStoredModel: vi.fn(() => 'google/gemini-2.5-flash'),
    setStoredModel: vi.fn(),
    fetchOpenRouterModels: vi.fn().mockResolvedValue([]),
  };
});

describe('AiTranslateModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems = [
    { key: 'auth.login', en: 'Sign In', my: '' },
    { key: 'auth.logout', en: 'Sign Out', my: 'ထွက်ရန်' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    items: mockItems,
    languages: ['en', 'my'],
    onApplyTranslations: vi.fn(),
  };

  it('renders modal with API key input and options', () => {
    render(<AiTranslateModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'AI Auto-Translate (OpenRouter)' })).not.toBeNull();
    expect(screen.getByPlaceholderText('sk-or-v1-...')).not.toBeNull();
    expect(screen.getByText('OpenRouter API Key')).not.toBeNull();
  });

  it('validates API key when Test button is clicked', async () => {
    render(<AiTranslateModal {...defaultProps} />);
    const keyInput = screen.getByPlaceholderText('sk-or-v1-...');
    fireEvent.change(keyInput, { target: { value: 'sk-or-v1-testkey123' } });

    const testBtn = screen.getByRole('button', { name: 'Test' });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(openrouterLib.testOpenRouterKey).toHaveBeenCalledWith('sk-or-v1-testkey123');
      expect(screen.getByText(/Key verified/i)).not.toBeNull();
    });
  });

  it('translates missing keys and applies updated items', async () => {
    render(<AiTranslateModal {...defaultProps} />);
    const keyInput = screen.getByPlaceholderText('sk-or-v1-...');
    fireEvent.change(keyInput, { target: { value: 'sk-or-v1-validkey' } });

    const translateBtn = screen.getByRole('button', { name: /Translate 1 Key/i });
    expect((translateBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(translateBtn);

    await waitFor(() => {
      expect(openrouterLib.translateBatchWithOpenRouter).toHaveBeenCalled();
      expect(defaultProps.onApplyTranslations).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('closes modal when close button is clicked', () => {
    render(<AiTranslateModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button', { name: /Close/i });
    fireEvent.click(closeButtons[0]);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
