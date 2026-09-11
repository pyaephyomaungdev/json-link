// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ExportModal } from '../ExportModal';
import * as exporterLib from '@/lib/exporter';

vi.mock('@/lib/exporter', () => ({
  exportToExcel: vi.fn().mockResolvedValue(undefined),
  exportToCsv: vi.fn().mockResolvedValue(undefined),
  exportToJsonZip: vi.fn().mockResolvedValue(undefined),
  exportToCombinedJson: vi.fn().mockResolvedValue(undefined),
  exportToYamlZip: vi.fn().mockResolvedValue(undefined),
  exportToAndroidXmlZip: vi.fn().mockResolvedValue(undefined),
  exportToIosStringsZip: vi.fn().mockResolvedValue(undefined),
  exportToArbZip: vi.fn().mockResolvedValue(undefined),
  exportToTypeScriptDts: vi.fn().mockResolvedValue(undefined),
  exportAllAsProjectBundle: vi.fn().mockResolvedValue(undefined),
  generateLanguageJsonData: vi.fn(() => ({ hello: 'Hello' })),
  generateArbData: vi.fn(() => ({ hello: 'Hello' })),
  objectToYaml: vi.fn(() => 'hello: Hello'),
}));

describe('ExportModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    items: [{ key: 'hello', en: 'Hello', my: 'မင်္ဂလာပါ' }],
    languages: ['en', 'my'],
    defaultFilename: 'test_translations',
  };

  it('renders correctly with export formats and options', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Export Translations' })).not.toBeNull();
    expect(screen.getAllByText(/Excel \(\.xlsx\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Full Bundle/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Flutter ARB/i).length).toBeGreaterThan(0);
  });

  it('calls exportToExcel on Excel format by default', async () => {
    render(<ExportModal {...defaultProps} />);
    const downloadBtn = screen.getByRole('button', { name: /Download EXCEL/i });
    fireEvent.click(downloadBtn);

    expect(exporterLib.exportToExcel).toHaveBeenCalledWith(
      defaultProps.items,
      defaultProps.languages,
      'test_translations.xlsx'
    );
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('switches to Flutter ARB tab and triggers exportToArbZip', async () => {
    render(<ExportModal {...defaultProps} />);
    const arbTab = screen.getByRole('button', { name: /Flutter ARB/i });
    fireEvent.click(arbTab);

    const downloadBtn = screen.getByRole('button', { name: /Download ARB ZIP/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(exporterLib.exportToArbZip).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('switches to Full Bundle and triggers exportAllAsProjectBundle', async () => {
    render(<ExportModal {...defaultProps} />);
    const bundleTab = screen.getByRole('button', { name: /Full Bundle/i });
    fireEvent.click(bundleTab);

    const downloadBtn = screen.getByRole('button', { name: /Download PROJECT BUNDLE/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(exporterLib.exportAllAsProjectBundle).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    render(<ExportModal {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
