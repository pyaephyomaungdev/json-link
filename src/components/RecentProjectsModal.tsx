import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Clock, Trash2, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import { RecentProject, listRecentProjects, deleteRecentProject, clearRecentProjects } from '@/lib/project';
import { JsonLinkProject } from '@/types';

interface RecentProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (project: JsonLinkProject) => void;
}

export const RecentProjectsModal: React.FC<RecentProjectsModalProps> = ({
  isOpen,
  onClose,
  onOpenProject,
}) => {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await listRecentProjects();
      setProjects(list);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteRecentProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAll = async () => {
    await clearRecentProjects();
    setProjects([]);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="size-4.5 text-primary" />
            <span>Recent Projects & History</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Quickly restore previously edited localization projects stored in your browser's private IndexedDB storage.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Loading recent projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-border rounded-xl p-6 bg-muted/20">
              <FileSpreadsheet className="size-8 text-muted-foreground/50" />
              <p className="font-semibold text-foreground text-sm">No recent projects yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                As you edit, import, or save localization files, they will automatically appear here for one-click restoration.
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => {
                    if (proj.projectData) {
                      onOpenProject(proj.projectData);
                      onClose();
                    }
                  }}
                  className={`group flex items-center justify-between p-3 rounded-lg border border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 transition-all ${
                    proj.projectData ? 'cursor-pointer' : 'cursor-default opacity-80'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate text-sm">
                        {proj.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {proj.itemCount} {proj.itemCount === 1 ? 'key' : 'keys'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 shrink-0" />
                        {formatDate(proj.updatedAt)}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {proj.languages.map(lang => (
                          <span
                            key={lang}
                            className="px-1 py-0.2 bg-muted rounded text-[10px] font-mono font-medium text-foreground uppercase"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {proj.projectData && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          if (proj.projectData) {
                            onOpenProject(proj.projectData);
                            onClose();
                          }
                        }}
                      >
                        <span>Open</span>
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    )}
                    <button
                      type="button"
                      title="Remove from history"
                      onClick={e => handleDelete(proj.id, e)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {projects.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-8"
            >
              <Trash2 className="size-3.5" />
              <span>Clear History</span>
            </Button>
          ) : (
            <div />
          )}

          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
