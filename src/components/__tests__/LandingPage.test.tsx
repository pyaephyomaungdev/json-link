// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LandingPage } from '../LandingPage';

describe('LandingPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = {
    onStartEmptySheet: vi.fn(),
    onResetToSample: vi.fn(),
    onDirectFiles: vi.fn(),
    onOpenAbout: vi.fn(),
    onOpenDocs: vi.fn(),
    isDark: false,
    onToggleTheme: vi.fn(),
  };

  it('renders headline, product hunt badge, and core action buttons', () => {
    render(<LandingPage {...baseProps} />);

    expect(screen.getByText(/The Local-First Translation Spreadsheet/i)).not.toBeNull();
    expect(screen.getByAltText(/JSON Link - Local-first open-source i18n spreadsheet & MCP server/i)).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /Start Empty Sheet/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Browse Files/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('calls onStartEmptySheet when Start Empty Sheet is clicked', () => {
    render(<LandingPage {...baseProps} />);

    const startBtns = screen.getAllByRole('button', { name: /Start Empty Sheet/i });
    fireEvent.click(startBtns[0]);

    expect(baseProps.onStartEmptySheet).toHaveBeenCalledTimes(1);
  });

  it('calls onResetToSample when sample data link is clicked', () => {
    render(<LandingPage {...baseProps} />);

    const sampleBtn = screen.getByRole('button', { name: /sample data/i });
    fireEvent.click(sampleBtn);

    expect(baseProps.onResetToSample).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenAbout and onOpenDocs from footer links', () => {
    render(<LandingPage {...baseProps} />);

    const docsLinks = screen.getAllByRole('button', { name: /Documentation/i });
    fireEvent.click(docsLinks[0]);
    expect(baseProps.onOpenDocs).toHaveBeenCalledTimes(1);

    const aboutLinks = screen.getAllByRole('button', { name: /About/i });
    fireEvent.click(aboutLinks[0]);
    expect(baseProps.onOpenAbout).toHaveBeenCalledTimes(1);
  });
});
