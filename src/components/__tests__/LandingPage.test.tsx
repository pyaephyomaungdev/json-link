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

  it('renders the pain-first headline, locked placeholders, and primary actions', () => {
    render(<LandingPage {...baseProps} />);

    expect(screen.getByRole('heading', { level: 1, name: /Translate your app without breaking it/i })).not.toBeNull();
    expect(screen.getByText(/Placeholders stay locked/i)).not.toBeNull();
    expect(screen.getAllByText('%1$s').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByAltText(/Product Hunt/i)).toBeNull();
    expect(screen.getByRole('link', { name: 'Product Hunt' }).getAttribute('href')).toContain('producthunt.com');
    expect(screen.getByRole('button', { name: /Try with sample data/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Open my locale files/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Start an empty sheet/i })).not.toBeNull();
  });

  it('calls onStartEmptySheet when the empty sheet link is clicked', () => {
    render(<LandingPage {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Start an empty sheet/i }));

    expect(baseProps.onStartEmptySheet).toHaveBeenCalledTimes(1);
  });

  it('calls onResetToSample when Try with sample data is clicked', () => {
    render(<LandingPage {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Try with sample data/i }));

    expect(baseProps.onResetToSample).toHaveBeenCalledTimes(1);
  });

  it('opens locale files from the secondary call to action', () => {
    render(<LandingPage {...baseProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: /Open my locale files/i }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('uses real About and Docs links in the footer', () => {
    render(<LandingPage {...baseProps} />);

    const docsLink = screen.getByRole('link', { name: /Documentation/i });
    expect(docsLink.getAttribute('href')).toBe('/docs');
    fireEvent.click(docsLink);
    expect(baseProps.onOpenDocs).toHaveBeenCalledTimes(1);

    const aboutLink = screen.getByRole('link', { name: /About JSON Link/i });
    expect(aboutLink.getAttribute('href')).toBe('/about');
    fireEvent.click(aboutLink);
    expect(baseProps.onOpenAbout).toHaveBeenCalledTimes(1);
  });
});
