// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

    expect(exportSpy).toHaveBeenCalledWith('my-mobile-app', baseProps.items, baseProps.languages);
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(baseProps.onConfirmExit).toHaveBeenCalledTimes(1);
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
});
