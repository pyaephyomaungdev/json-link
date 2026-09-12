// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test application crash');
  }
  return <div>Healthy Child Content</div>;
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy Child Content')).not.toBeNull();
  });

  it('renders redesigned safe recovery mode screen when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-screen')).not.toBeNull();
    expect(screen.getByText('Something Went Wrong')).not.toBeNull();
    expect(screen.getByText('Test application crash')).not.toBeNull();
    expect(screen.getByText('Application Crash Caught • Safe Recovery Mode')).not.toBeNull();
    expect(screen.getByText('Retry Workspace')).not.toBeNull();
    expect(screen.getByText('Reload Application')).not.toBeNull();
    expect(screen.getByText('Copy Diagnostics')).not.toBeNull();

    spy.mockRestore();
  });

  it('toggles technical details when button is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    const toggleBtn = screen.getByText('Show technical stack trace');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Hide technical details')).not.toBeNull();

    spy.mockRestore();
  });

  it('calls custom fallback function if provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={(err) => <div>Custom fallback: {err.message}</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback: Test application crash')).not.toBeNull();

    spy.mockRestore();
  });
});
