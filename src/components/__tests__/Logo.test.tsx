// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Logo } from '../Logo';

describe('Logo', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders default logo with JSON Link brand text', () => {
    render(<Logo />);
    expect(screen.getByText('JSON')).not.toBeNull();
    expect(screen.getByText('Link')).not.toBeNull();
  });

  it('hides brand text when showText is false', () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText('JSON')).toBeNull();
    expect(screen.queryByText('Link')).toBeNull();
  });

  it('renders correctly with different size props without crashing', () => {
    const { rerender } = render(<Logo size="sm" />);
    expect(screen.getByText('JSON')).not.toBeNull();

    rerender(<Logo size="lg" />);
    expect(screen.getByText('JSON')).not.toBeNull();
  });
});
