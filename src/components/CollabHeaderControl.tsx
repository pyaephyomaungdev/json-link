import React, { memo } from 'react';
import { Radio, Eye, EyeOff, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { CollabPeerUser, getPeerInitials } from '@/lib/collaboration';

export interface CollabHeaderControlProps {
  isCollabConnected: boolean;
  collabPeerCount: number;
  onOpenCollab: () => void;
  localPeerProfile?: CollabPeerUser;
  collabPeers?: CollabPeerUser[];
  followingPeerName?: string | null;
  onFollowPeer?: (name: string | null) => void;
  onJumpToPeerCell?: (key: string, field: string) => void;
}

interface AvatarRadiusRingArcProps {
  position?: 'left' | 'right' | 'bottom';
  isFollowing?: boolean;
}

function AvatarRadiusRingArc({ position = 'bottom', isFollowing = false }: AvatarRadiusRingArcProps) {
  // Symmetrically calibrated SVG circle offsets for concise arc with clean 1.5px gap:
  // - radius: 14.5px (viewBox 32x32, inset -4px)
  // - circumference ~91.1px
  // - 'left' (bottom-left): -28.2
  // - 'bottom' (bottom-center / အလယ်အောက်): -16.8
  // - 'right' (bottom-right): -5.4
  // When following:
  // - If position === 'bottom' (middle peer): arc stays at bottom center (-16.8), eye at (16, 30.5)
  // - If position === 'right' (last peer): arc curves up to (29.2, 13), eye at top-right tip
  const offset = isFollowing
    ? position === 'bottom'
      ? -16.8
      : position === 'left'
        ? -31.8
        : -2.5
    : position === 'left'
      ? -28.2
      : position === 'right'
        ? -5.4
        : -16.8;

  const dashArray = isFollowing && position !== 'bottom' ? '17 74' : '12 79';

  const eyeTranslate =
    position === 'bottom'
      ? 'translate(16, 30.5)'
      : position === 'left'
        ? 'translate(2.8, 13)'
        : 'translate(29.2, 13)';

  return (
    <svg
      className={`absolute -inset-1 size-8 pointer-events-none overflow-visible ${
        isFollowing
          ? 'text-amber-500 dark:text-amber-400'
          : 'text-emerald-500 dark:text-emerald-400'
      }`}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        strokeDashoffset={offset}
      />
      {isFollowing && (
        <g transform={eyeTranslate} data-testid="follow-arc-eye">
          {/* Merged circle seamlessly continuing the arc in matching amber color */}
          <circle
            cx="0"
            cy="0"
            r="5.5"
            fill="currentColor"
          />
          {/* Crisp pure white Eye glyph */}
          <path
            d="M -3.2 0 C -1.6 -2.2 1.6 -2.2 3.2 0 C 1.6 2.2 -1.6 2.2 -3.2 0 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="0" r="1.1" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}

export const CollabHeaderControl: React.FC<CollabHeaderControlProps> = memo(({
  isCollabConnected,
  collabPeerCount,
  onOpenCollab,
  localPeerProfile,
  collabPeers = [],
  followingPeerName,
  onFollowPeer,
  onJumpToPeerCell,
}) => {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Live Collaboration Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCollab}
        className={`h-7 px-2 text-xs gap-1.5 cursor-pointer shadow-2xs transition-all ${
          isCollabConnected
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title={
          isCollabConnected
            ? `Live WebRTC Room Active (${collabPeerCount} online) - Click to manage`
            : 'Real-Time Peer-to-Peer Collaboration (WebRTC)'
        }
      >
        {isCollabConnected ? (
          <span className="relative flex size-2 shrink-0 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
        ) : (
          <Radio className="size-3 text-muted-foreground" />
        )}
        <span>{isCollabConnected ? `Live (${collabPeerCount})` : 'Live'}</span>
      </Button>

      {/* Peer Avatars Stack */}
      {isCollabConnected && (
        <div className="flex items-center -space-x-1.5 overflow-visible px-0.5">
          {/* Local user avatar bubble (left-most) with bottom-left radius ring arc */}
          {localPeerProfile && (
            <div
              className="relative size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background shadow-xs select-none cursor-default bg-[var(--peer-color)]"
              style={{ '--peer-color': localPeerProfile.color } as React.CSSProperties}
              title={`You: ${localPeerProfile.name} (Active)`}
            >
              {getPeerInitials(localPeerProfile.name)}
              <AvatarRadiusRingArc position={collabPeers.length > 0 ? 'left' : 'bottom'} />
            </div>
          )}

          {/* Remote peer avatars with Follow Mode Dropdown */}
          {collabPeers.map((peer, idx) => {
            const isFollowingThis = followingPeerName === peer.name;
            const isLast = idx === collabPeers.length - 1;
            return (
              <DropdownMenu key={peer.name}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`relative size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background transition-transform hover:scale-110 hover:z-30 shadow-xs select-none cursor-pointer outline-none bg-[var(--peer-color)] ${
                      isFollowingThis ? 'scale-105 z-20' : ''
                    }`}
                    style={{ '--peer-color': peer.color } as React.CSSProperties}
                    title={`${peer.name}${
                      peer.activeCell ? ` (Editing: ${peer.activeCell.key})` : ' (Viewing)'
                    } - Click for Follow & Jump`}
                  >
                    {getPeerInitials(peer.name)}
                    <AvatarRadiusRingArc
                      position={isLast ? 'right' : 'bottom'}
                      isFollowing={isFollowingThis}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2.5 rounded-full shrink-0 bg-[var(--peer-color)]"
                      style={{ '--peer-color': peer.color } as React.CSSProperties}
                    />
                    <span className="font-semibold text-foreground truncate">{peer.name}</span>
                    <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Online
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {peer.activeCell && (
                    <div className="px-2 py-1.5 text-[11px] bg-muted/50 rounded-md mx-1 my-1 border border-border/60">
                      <span className="text-muted-foreground block text-[10px]">Active Location:</span>
                      <span className="font-mono font-semibold text-foreground truncate block">
                        {peer.activeCell.key}
                      </span>
                      <span className="text-[10px] text-primary font-mono uppercase">
                        [{peer.activeCell.field}]
                      </span>
                    </div>
                  )}

                  {peer.activeCell && onJumpToPeerCell && (
                    <DropdownMenuItem
                      onClick={() => onJumpToPeerCell(peer.activeCell!.key, peer.activeCell!.field)}
                      className="gap-2 cursor-pointer text-xs items-start"
                    >
                      <UserCheck className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">Jump to Active Cell</span>
                    </DropdownMenuItem>
                  )}

                  {onFollowPeer && (
                    <DropdownMenuItem
                      onClick={() => onFollowPeer(isFollowingThis ? null : peer.name)}
                      className={`gap-2 cursor-pointer text-xs items-start ${
                        isFollowingThis ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
                      }`}
                    >
                      {isFollowingThis ? (
                        <>
                          <EyeOff className="size-3.5 shrink-0 mt-0.5" />
                          <span className="leading-snug">Stop Following {peer.name}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">Follow {peer.name}'s Cursor</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      )}
    </div>
  );
});

CollabHeaderControl.displayName = 'CollabHeaderControl';
