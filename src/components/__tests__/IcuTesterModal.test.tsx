// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IcuTesterModal } from '../IcuTesterModal';
import { TranslationItem } from '@/types';

describe('IcuTesterModal', () => {
  afterEach(() => {
    cleanup();
  });

  const items: TranslationItem[] = [
    {
      key: 'notif.count',
      en: '{count, plural, =0{No alerts} one{1 alert} other{# alerts}}',
      my: '{count, plural, other{# ခု}}',
    },
  ];

  it('renders modal with title and count variable controls', () => {
    render(
      <IcuTesterModal
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        languages={['en', 'my']}
      />
    );

    expect(screen.getByText('ICU Plural & Variable Tester')).not.toBeNull();
    expect(screen.getByText('Count variable:')).not.toBeNull();
  });

  it('updates evaluation when count button is clicked', () => {
    render(
      <IcuTesterModal
        isOpen={true}
        onClose={vi.fn()}
        items={items}
        languages={['en', 'my']}
      />
    );

    const btn0 = screen.getByRole('button', { name: '0' });
    fireEvent.click(btn0);

    expect(screen.getAllByText('No items').length).toBeGreaterThanOrEqual(1);
  });
});
