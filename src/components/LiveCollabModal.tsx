import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Radio,
  Copy,
  Check,
  ShieldCheck,
  LogOut,
  Sparkles,
  Lock,
  Wifi,
} from 'lucide-react';
import {
  generateCollabRoomId,
  generateRandomPeerProfile,
  CollabPeerUser,
} from '@/lib/collaboration';

interface LiveCollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  currentRoomId: string | null;
  currentRoomPassword?: string | null;
  peers: CollabPeerUser[];
  localUser: CollabPeerUser;
  onStartSession: (roomId: string, password: string | null, userName: string) => void;
  onEndSession: () => void;
}

export const LiveCollabModal: React.FC<LiveCollabModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  currentRoomId,
  currentRoomPassword,
  peers,
  localUser,
  onStartSession,
  onEndSession,
}) => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState(localUser.name);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !isConnected && !roomId) {
      setRoomId(generateCollabRoomId());
    }
  }, [isOpen, isConnected, roomId]);

  useEffect(() => {
    if (localUser.name && !userName) {
      setUserName(localUser.name);
    }
  }, [localUser.name, userName]);

  const handleCopyLink = () => {
    if (!currentRoomId) return;
    const url = new URL(window.location.origin + window.location.pathname);
    let hash = `#collab=${currentRoomId}`;
    if (currentRoomPassword) {
      hash += `&key=${encodeURIComponent(currentRoomPassword)}`;
    }
    url.hash = hash;

    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRandomizeProfile = () => {
    const p = generateRandomPeerProfile();
    setUserName(p.name);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    onStartSession(
      roomId.trim().toLowerCase(),
      password.trim() || null,
      userName.trim() || localUser.name
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {isConnected ? <Radio className="size-4 animate-pulse" /> : <Users className="size-4" />}
            </span>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                P2P Live Collaboration
                {isConnected && (
                  <Badge variant="success" className="text-[10px] font-mono py-0 h-4">
                    Active Room
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Zero-backend, peer-to-peer WebRTC spreadsheet synchronization.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {isConnected ? (
            /* Active Live Session View */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Room ID:</span>
                  <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                    {currentRoomId}
                  </span>
                </div>

                {currentRoomPassword && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <Lock className="size-3 text-emerald-500" /> Encryption Key:
                    </span>
                    <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                      {currentRoomPassword}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20">
                  <span className="text-muted-foreground font-medium">Connected Peers:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    {peers.length + 1} online
                  </span>
                </div>
              </div>

              {/* Peers List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Collaborators in this room
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {/* Local user */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/80 bg-muted/30 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full shrink-0 bg-[var(--peer-color)]"
                        style={{ '--peer-color': localUser.color } as React.CSSProperties}
                      />
                      <span className="font-semibold text-foreground">{localUser.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                      You
                    </Badge>
                  </div>

                  {/* Remote peers */}
                  {peers.map((peer, idx) => (
                    <div
                      key={`${peer.name}-${idx}`}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/60 bg-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full shrink-0 bg-[var(--peer-color)]"
                          style={{ '--peer-color': peer.color } as React.CSSProperties}
                        />
                        <span className="font-medium text-foreground">{peer.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Connected
                      </span>
                    </div>
                  ))}

                  {peers.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic py-1 text-center">
                      Waiting for peers to join. Share the invite link below.
                    </p>
                  )}
                </div>
              </div>

              {/* Invite Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Share Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#collab=${currentRoomId}${
                      currentRoomPassword ? `&key=${encodeURIComponent(currentRoomPassword)}` : ''
                    }`}
                    className="h-8 text-xs font-mono bg-muted/40 cursor-text"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-1.5 text-xs font-semibold shrink-0 cursor-pointer h-8"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Start / Join Live Session Form */
            <form onSubmit={handleConnect} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Your Display Name</label>
                  <button
                    type="button"
                    onClick={handleRandomizeProfile}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> Randomize
                  </button>
                </div>
                <Input
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. Panda-42"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Room ID</label>
                  <button
                    type="button"
                    onClick={() => setRoomId(generateCollabRoomId())}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    New Room ID
                  </button>
                </div>
                <Input
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  placeholder="e.g. collab-9x2a"
                  className="h-8 text-xs font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Lock className="size-3 text-muted-foreground" /> Room Password (Optional E2EE Key)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave empty for open P2P room"
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  If set, data is end-to-end encrypted with AES-GCM before transmitting over WebRTC.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Private P2P:</strong> Your translation edits stream directly between browser tabs through encrypted WebRTC DataChannels. No database, no cloud storage.
                </span>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Wifi className="size-3.5" /> Start / Join Room
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogBody>

        {isConnected && (
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onEndSession();
                onClose();
              }}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="size-3.5" /> Leave Room
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
