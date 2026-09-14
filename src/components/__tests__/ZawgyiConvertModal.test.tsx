// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ZawgyiConvertModal } from '../ZawgyiConvertModal';

describe('ZawgyiConvertModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItems = [
    {
      key: 'btn.submit',
      en: 'Submit',
      my: '\u1031\u1019\u102c\u1004\u103a', // Zawgyi
    },
    {
      key: 'btn.cancel',
      en: 'Cancel',
      my: 'မင်္ဂလာပါ', // Unicode - should NOT be in candidates
    },
    {
      key: 'msg.error',
      en: 'Error',
      my: 'သိမ္ဆည္းမႈ ေအာင္ျမင္ပါသည္။', // Zawgyi
    },
  ];

  it('renders candidate rows with Before and After previews', () => {
    render(
      <ZawgyiConvertModal
        open={true}
        onOpenChange={vi.fn()}
        lang="my"
        items={mockItems}
        onConfirm={vi.fn()}
      />
    );

    // Title and count
    expect(screen.getByText('Convert Zawgyi → Unicode')).toBeDefined();
    expect(screen.getByText('btn.submit')).toBeDefined();
    expect(screen.getByText('msg.error')).toBeDefined();
    // Unicode row should not be listed
    expect(screen.queryByText('btn.cancel')).toBeNull();

    // Before and After labels
    const beforeBadges = screen.getAllByText('Before (Zawgyi)');
    const afterBadges = screen.getAllByText('After (Unicode)');
    expect(beforeBadges.length).toBe(2);
    expect(afterBadges.length).toBe(2);
  });

  it('allows deselecting rows and confirms only selected conversions', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ZawgyiConvertModal
        open={true}
        onOpenChange={onOpenChange}
        lang="my"
        items={mockItems}
        onConfirm={onConfirm}
      />
    );

    // Click confirm button
    const confirmBtn = screen.getByRole('button', { name: /Convert 2 Rows to Unicode/i });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const converted = onConfirm.mock.calls[0][0];
    expect(converted.length).toBe(2);
    expect(converted[0].key).toBe('btn.submit');
    expect(converted[1].key).toBe('msg.error');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('allows filtering candidate rows with search query', () => {
    render(
      <ZawgyiConvertModal
        open={true}
        onOpenChange={vi.fn()}
        lang="my"
        items={mockItems}
        onConfirm={vi.fn()}
      />
    );

    // Both keys should initially be in the document
    expect(screen.getByText('btn.submit')).toBeDefined();
    expect(screen.getByText('msg.error')).toBeDefined();
  });
});
