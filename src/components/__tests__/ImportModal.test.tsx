// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ImportModal } from '../ImportModal';
import { TranslationItem } from '@/types';

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

  it('warns when an encrypted project file is uploaded', async () => {
    render(<ImportModal {...defaultProps} />);

    const encryptedJson = JSON.stringify({
      format: 'jsonlink',
      version: '1.0',
      encrypted: true,
      enc: 'aes-256-gcm',
      ciphertext: 'abcd',
      iv: '1234',
      salt: '5678',
    });
    const file = new File([encryptedJson], 'secret.jsonlink', { type: 'application/json' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/"secret\.jsonlink" is password-protected/i)).not.toBeNull();
    });
  });

  it('calls onOpenChange(false) when cancel button is clicked', () => {
    render(<ImportModal {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles uploading XLIFF (.xlf) and GNU gettext (.po) files', async () => {
    render(<ImportModal {...defaultProps} />);

    const xlfContent = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="es" datatype="plaintext" original="messages">
    <body>
      <trans-unit id="greeting">
        <source>Hello</source>
        <target>Hola</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
    const xlfFile = new File([xlfContent], 'messages_es.xlf', { type: 'application/x-xliff+xml' });

    const poContent = `msgid ""
msgstr ""
"Language: fr\\n"

msgid "greeting"
msgstr "Bonjour"
`;
    const poFile = new File([poContent], 'fr.po', { type: 'text/x-gettext' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [xlfFile, poFile] } });

    await waitFor(() => {
      expect(screen.getByText('messages_es.xlf')).not.toBeNull();
      expect(screen.getByText('fr.po')).not.toBeNull();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply Import/i });
    fireEvent.click(applyBtn);

    expect(defaultProps.onImportComplete).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('imports Flutter ARB keys instead of treating the file as a language map', async () => {
    render(<ImportModal {...defaultProps} />);

    const arbContent = JSON.stringify({
      '@@locale': 'en',
      hello: 'Hello',
      '@hello': { description: 'Greeting' },
    });
    const file = new File([arbContent], 'app_en.arb', { type: 'application/json' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('app_en.arb')).not.toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: /Replace All Data/i }));
    fireEvent.click(screen.getByRole('button', { name: /Apply Import/i }));

    expect(defaultProps.onImportComplete).toHaveBeenCalled();
    const lastCall = defaultProps.onImportComplete.mock.calls.at(-1);
    expect(lastCall).toBeTruthy();
    const [items, languages] = lastCall as [
      Array<TranslationItem & { description?: string; en?: string }>,
      string[],
    ];
    expect(languages).toContain('en');
    expect(languages).not.toContain('items');
    expect(items.find(row => row.key === 'hello')?.en).toBe('Hello');
    expect(items.find(row => row.key === 'hello')?.description).toBe('Greeting');
  });
});
