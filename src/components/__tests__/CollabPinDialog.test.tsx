// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CollabPinDialog } from '../CollabPinDialog';

describe('CollabPinDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    roomId: 'yfq-khjt-efn',
    onJoin: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders room ID badge, PIN input, and join button in default input view', () => {
    render(<CollabPinDialog {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /Join Collaboration Room/i })).not.toBeNull();
    expect(screen.getByText('yfq-khjt-efn')).not.toBeNull();
    expect(screen.getByPlaceholderText(/Enter room PIN or password\.\.\./i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /Join Room/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Cancel/i })).not.toBeNull();
  });

  it('submits entered PIN when user types PIN and submits form', () => {
    render(<CollabPinDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Enter room PIN or password\.\.\./i);
    fireEvent.change(input, { target: { value: '1234' } });

    const joinBtn = screen.getByRole('button', { name: /Join Room/i });
    fireEvent.click(joinBtn);

    expect(defaultProps.onJoin).toHaveBeenCalledWith('1234');
  });

  it('submits null when user leaves PIN empty and clicks join (public room)', () => {
    render(<CollabPinDialog {...defaultProps} />);

    const joinBtn = screen.getByRole('button', { name: /Join Room/i });
    fireEvent.click(joinBtn);

    expect(defaultProps.onJoin).toHaveBeenCalledWith(null);
  });

  it('toggles password visibility when show/hide button is clicked', () => {
    render(<CollabPinDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Enter room PIN or password\.\.\./i) as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/Show PIN/i);
    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');

    const hideBtn = screen.getByLabelText(/Hide PIN/i);
    fireEvent.click(hideBtn);
    expect(input.type).toBe('password');
  });

  it('calls onCancel and onOpenChange when Cancel button is clicked', () => {
    render(<CollabPinDialog {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders dedicated Authentication Failed Error Modal and calls onClearError on Try Again', () => {
    const onClearError = vi.fn();
    render(
      <CollabPinDialog
        {...defaultProps}
        errorMessage="Incorrect room PIN or password. Please verify and try again."
        onClearError={onClearError}
      />
    );

    expect(screen.getByText('Authentication Failed')).not.toBeNull();
    expect(
      screen.getByText('Incorrect room PIN or password. Please verify and try again.')
    ).not.toBeNull();

    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
    expect(tryAgainBtn).not.toBeNull();
    fireEvent.click(tryAgainBtn);

    expect(onClearError).toHaveBeenCalled();
  });

  it('calls onClearError automatically on open and room change', () => {
    const onClearError = vi.fn();
    const { rerender } = render(
      <CollabPinDialog
        {...defaultProps}
        open={true}
        roomId="room-aaa"
        onClearError={onClearError}
      />
    );

    expect(onClearError).toHaveBeenCalled();
    onClearError.mockClear();

    rerender(
      <CollabPinDialog
        {...defaultProps}
        open={true}
        roomId="room-bbb"
        onClearError={onClearError}
      />
    );

    expect(onClearError).toHaveBeenCalled();
  });

  it('renders dedicated Connecting Modal Screen with cancel button when isConnecting is true', () => {
    render(
      <CollabPinDialog
        {...defaultProps}
        isConnecting={true}
      />
    );

    expect(screen.getByText('Connecting to Room')).not.toBeNull();
    expect(screen.getByText('Connecting to Collaboration Session')).not.toBeNull();
    expect(
      screen.getByText(/Verifying room credentials and synchronizing translations/i)
    ).not.toBeNull();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelBtn).not.toBeNull();
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('renders PIN input view directly with amber password required banner when room is password-protected', () => {
    render(
      <CollabPinDialog
        {...defaultProps}
        errorMessage="This room is password-protected. Please enter the room PIN code."
      />
    );

    // Should NOT show authentication failed screen
    expect(screen.queryByText('Authentication Failed')).toBeNull();

    // Should show password required banner and direct PIN input form
    expect(screen.getByText('Password Required')).not.toBeNull();
    expect(
      screen.getByText('This room is password-protected. Please enter the room PIN code.')
    ).not.toBeNull();
    expect(screen.getByPlaceholderText(/Enter room PIN or password\.\.\./i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /Join Room/i })).not.toBeNull();
  });
});
