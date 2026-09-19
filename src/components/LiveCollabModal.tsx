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
  normalizeCollabRoomId,
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
  const [includeKeyInLink, setIncludeKeyInLink] = useState(true);

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
    if (currentRoomPassword && includeKeyInLink) {
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
      normalizeCollabRoomId(roomId),
      password.trim() || null,
      userName.trim() || localUser.name
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>P2P Live Collaboration</span>
            {isConnected && (
              <Badge variant="success" className="text-[10px] font-mono py-0 h-4">
                Active Room
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Peer-to-peer WebRTC synchronization powered by Yjs CRDT. A signaling relay is used to connect peers. Optional AES-GCM E2EE when a room PIN is set.
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <>
            <DialogBody className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Room ID:</span>
                  <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                    {currentRoomId}
                  </span>
                </div>

                {currentRoomPassword && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Lock className="size-3 text-emerald-500" /> Encryption Key:
                    </span>
                    <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                      {currentRoomPassword}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground font-medium">Connected Peers:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    {peers.length + 1} online
                  </span>
                </div>
              </div>

              {/* Peers List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Collaborators in this room
                </span>
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
                <label htmlFor="collab-share-link" className="text-xs font-semibold text-foreground block">
                  Share Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="collab-share-link"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#collab=${currentRoomId}${
                      currentRoomPassword && includeKeyInLink
                        ? `&key=${encodeURIComponent(currentRoomPassword)}`
                        : ''
                    }`}
                    className="h-9 text-xs font-mono bg-muted/40 cursor-text"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-1.5 text-xs font-semibold shrink-0 cursor-pointer h-9 px-3"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                {currentRoomPassword && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="collab-include-key"
                      checked={includeKeyInLink}
                      onChange={e => setIncludeKeyInLink(e.target.checked)}
                      className="size-3.5 rounded border-muted-foreground/30 accent-primary cursor-pointer"
                    />
                    <label
                      htmlFor="collab-include-key"
                      className="text-[11px] text-muted-foreground cursor-pointer select-none"
                    >
                      Include PIN code in link (recipients join directly)
                    </label>
                  </div>
                )}
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 sm:flex-none text-xs h-8 cursor-pointer"
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
                className="flex-1 sm:flex-none gap-1.5 text-xs h-8 font-semibold cursor-pointer"
              >
                <LogOut className="size-3.5" /> Leave Room
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleConnect} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogBody className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="collab-name" className="text-xs font-semibold text-foreground">
                    Your Display Name
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomizeProfile}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles className="size-3" /> Randomize
                  </button>
                </div>
                <Input
                  id="collab-name"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. Panda-42"
                  className="h-9 text-xs bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="collab-room" className="text-xs font-semibold text-foreground">
                    Room ID
                  </label>
                  <button
                    type="button"
                    onClick={() => setRoomId(generateCollabRoomId())}
                    className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                  >
                    New Room ID
                  </button>
                </div>
                <Input
                  id="collab-room"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  placeholder="e.g. yfq-khjt-efn"
                  className="h-9 text-xs font-mono lowercase bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="collab-pass" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="size-3 text-muted-foreground" />
                  <span>Room Password <span className="text-muted-foreground font-normal">(Optional E2EE Key)</span></span>
                </label>
                <Input
                  id="collab-pass"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave empty for open P2P room"
                  className="h-9 text-xs font-mono bg-background"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  If set, data is end-to-end encrypted with AES-GCM before transmitting over WebRTC.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground font-medium">P2P Data Transfer:</strong> Your translation edits stream peer-to-peer over WebRTC DataChannels. When a room PIN is set, data is encrypted with AES-GCM before transmitting. Zero server storage, no database.
                </span>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 sm:flex-none text-xs h-8 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 sm:flex-none gap-1.5 text-xs h-8 font-semibold cursor-pointer"
              >
                <Wifi className="size-3.5" /> Start / Join Room
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
