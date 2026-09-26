// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { RecentProjectsModal } from '../RecentProjectsModal';
import * as projectLib from '@/lib/project';

vi.mock('@/lib/project', async () => {
  const actual = await vi.importActual<any>('@/lib/project');
  return {
    ...actual,
    listRecentProjects: vi.fn(),
    deleteRecentProject: vi.fn().mockResolvedValue(undefined),
    clearRecentProjects: vi.fn().mockResolvedValue(undefined),
  };
});

describe('RecentProjectsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockProjects: projectLib.RecentProject[] = [
    {
      id: 'rec_1',
      name: 'Mobile App Localization',
      updatedAt: '2026-09-20T10:00:00.000Z',
      languages: ['en', 'my', 'th'],
      itemCount: 42,
      projectData: {
        format: 'jsonlink',
        version: '1.0.0',
        name: 'Mobile App Localization',
        updatedAt: '2026-09-20T10:00:00.000Z',
        languages: ['en', 'my', 'th'],
        items: [{ key: 'app.title', en: 'App', my: 'အက်ပ်', th: 'แอพ' }],
      },
    },
    {
      id: 'rec_2',
      name: 'Web Dashboard',
      updatedAt: '2026-09-19T08:00:00.000Z',
      languages: ['en', 'ja'],
      itemCount: 15,
      projectData: {
        format: 'jsonlink',
        version: '1.0.0',
        name: 'Web Dashboard',
        updatedAt: '2026-09-19T08:00:00.000Z',
        languages: ['en', 'ja'],
        items: [{ key: 'dash.title', en: 'Dashboard', ja: 'ダッシュボード' }],
      },
    },
  ];

  it('renders loading and then projects list', async () => {
    vi.mocked(projectLib.listRecentProjects).mockResolvedValue(mockProjects);
    const onOpenProject = vi.fn();
    const onClose = vi.fn();

    render(
      <RecentProjectsModal
        isOpen={true}
        onClose={onClose}
        onOpenProject={onOpenProject}
      />
    );

    expect(screen.getByRole('heading', { name: /Recent Projects/i })).not.toBeNull();

    await waitFor(() => {
      expect(screen.getByText('Mobile App Localization')).not.toBeNull();
      expect(screen.getByText('Web Dashboard')).not.toBeNull();
    });

    expect(screen.getByText(/42/)).not.toBeNull();
    expect(screen.getByText(/15/)).not.toBeNull();
  });

  it('calls onOpenProject and onClose when clicking Open', async () => {
    vi.mocked(projectLib.listRecentProjects).mockResolvedValue(mockProjects);
    const onOpenProject = vi.fn();
    const onClose = vi.fn();

    render(
      <RecentProjectsModal
        isOpen={true}
        onClose={onClose}
        onOpenProject={onOpenProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Mobile App Localization')).not.toBeNull();
    });

    const openButtons = screen.getAllByRole('button', { name: /Open/i });
    fireEvent.click(openButtons[0]);

    expect(onOpenProject).toHaveBeenCalledWith(mockProjects[0].projectData);
    expect(onClose).toHaveBeenCalled();
  });

  it('deletes an item when clicking remove button', async () => {
    vi.mocked(projectLib.listRecentProjects).mockResolvedValue(mockProjects);
    const onOpenProject = vi.fn();
    const onClose = vi.fn();

    render(
      <RecentProjectsModal
        isOpen={true}
        onClose={onClose}
        onOpenProject={onOpenProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Mobile App Localization')).not.toBeNull();
    });

    const deleteButtons = screen.getAllByTitle('Remove from history');
    fireEvent.click(deleteButtons[0]);

    expect(projectLib.deleteRecentProject).toHaveBeenCalledWith('rec_1');
  });

  it('clears all history when clicking Clear History', async () => {
    vi.mocked(projectLib.listRecentProjects).mockResolvedValue(mockProjects);
    const onOpenProject = vi.fn();
    const onClose = vi.fn();

    render(
      <RecentProjectsModal
        isOpen={true}
        onClose={onClose}
        onOpenProject={onOpenProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Clear History')).not.toBeNull();
    });

    fireEvent.click(screen.getByText('Clear History'));

    expect(projectLib.clearRecentProjects).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('No recent projects yet')).not.toBeNull();
    });
  });
});
