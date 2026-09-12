// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TreeView } from '../TreeView';
import { TranslationItem } from '@/types';

describe('TreeView', () => {
  afterEach(() => {
    cleanup();
  });

  const items: TranslationItem[] = [
    { key: 'auth.login.title', en: 'Sign In', my: 'အကောင့်ဝင်ပါ', status: 'approved' },
    { key: 'auth.login.button', en: 'Log In', my: 'ဝင်မည်', status: 'draft' },
    { key: 'common.save', en: 'Save', my: 'သိမ်းဆည်းပါ' },
  ];

  it('renders tree namespaces and displays selected key details', () => {
    render(
      <TreeView
        items={items}
        languages={['en', 'my']}
        onUpdateCell={vi.fn()}
      />
    );

    expect(screen.getByText('auth.login.title')).not.toBeNull();
    expect(screen.getByDisplayValue('Sign In')).not.toBeNull();
    expect(screen.getByDisplayValue('အကောင့်ဝင်ပါ')).not.toBeNull();
  });

  it('calls onUpdateCell when text is edited in right pane', () => {
    const onUpdateCell = vi.fn();
    render(
      <TreeView
        items={items}
        languages={['en', 'my']}
        onUpdateCell={onUpdateCell}
      />
    );

    const enTextarea = screen.getByDisplayValue('Sign In');
    fireEvent.change(enTextarea, { target: { value: 'Welcome Back' } });

    expect(onUpdateCell).toHaveBeenCalledWith('auth.login.title', 'en', 'Welcome Back');
  });
});
