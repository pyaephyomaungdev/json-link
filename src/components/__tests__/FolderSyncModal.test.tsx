// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FolderSyncModal } from '../FolderSyncModal';

describe('FolderSyncModal', () => {
  beforeEach(() => {
    (window as any).showDirectoryPicker = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    folderName: null,
    fileCount: 0,
    lastSyncedAt: null,
    autoSync: false,
    onToggleAutoSync: vi.fn(),
    onSelectFolder: vi.fn().mockResolvedValue(undefined),
    onSyncToDisk: vi.fn().mockResolvedValue(undefined),
    onReloadFromDisk: vi.fn().mockResolvedValue(undefined),
    onDisconnectFolder: vi.fn(),
    isSyncing: false,
  };

  it('renders initial state when no folder is connected', () => {
    render(<FolderSyncModal {...baseProps} />);
    expect(screen.getByText('Local Folder Direct Sync')).not.toBeNull();
    expect(screen.getByText('No Local Folder Linked')).not.toBeNull();
    expect(screen.getByText('Choose Project Folder')).not.toBeNull();
  });

  it('calls onSelectFolder when Choose Project Folder is clicked', () => {
    render(<FolderSyncModal {...baseProps} />);
    const btn = screen.getByText('Choose Project Folder');
    fireEvent.click(btn);
    expect(baseProps.onSelectFolder).toHaveBeenCalledTimes(1);
  });

  it('renders connected folder details and triggers manual sync', () => {
    render(
      <FolderSyncModal
        {...baseProps}
        folderName="locales"
        fileCount={3}
        lastSyncedAt={new Date('2026-09-12T10:00:00Z')}
      />
    );

    expect(screen.getByText('📁 locales')).not.toBeNull();
    expect(screen.getByText('3 locale files detected')).not.toBeNull();
    expect(screen.getByText('Connected')).not.toBeNull();

    const syncBtn = screen.getByText('Sync to Disk Now');
    fireEvent.click(syncBtn);
    expect(baseProps.onSyncToDisk).toHaveBeenCalledTimes(1);
  });
});
