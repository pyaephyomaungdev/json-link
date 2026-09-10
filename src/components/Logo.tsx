import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'size-6',
    md: 'size-8',
    lg: 'size-12',
  };

  const badgeRadii = {
    sm: { outer: 'rounded-[8px]', inner: 'rounded-[6.5px]' },
    md: { outer: 'rounded-xl', inner: 'rounded-[10px]' },
    lg: { outer: 'rounded-[18px]', inner: 'rounded-[16px]' },
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Badge */}
      <div
        className={`${iconSizes[size]} relative ${badgeRadii[size].outer} bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 p-[1.5px] shadow-sm shrink-0 flex items-center justify-center`}
      >
        <div className={`w-full h-full bg-[#090d16] ${badgeRadii[size].inner} flex items-center justify-center relative overflow-hidden`}>
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20" />

          {/* SVG Symbol: Interlocking JSON Brackets & Link */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4/5 h-4/5 relative z-10"
          >
            {/* Left Bracket { */}
            <path
              d="M11 7C9.34315 7 8 8.34315 8 10V13C8 14.6569 6.65685 16 5 16C6.65685 16 8 17.3431 8 19V22C8 23.6569 9.34315 25 11 25"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right Bracket } */}
            <path
              d="M21 7C22.6569 7 24 8.34315 24 10V13C24 14.6569 25.3431 16 27 16C25.3431 16 24 17.3431 24 19V22C24 23.6569 22.6569 25 21 25"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Central Linking Nodes & Grid Crossbar */}
            <path
              d="M12 16H20"
              stroke="#818cf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="1 2.5"
            />
            <circle cx="12" cy="16" r="2" fill="#34d399" />
            <circle cx="20" cy="16" r="2" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 leading-none">
            <span
              className={`${textSizes[size]} font-extrabold tracking-tight text-foreground font-sans`}
            >
              JSON
            </span>
            <span
              className={`${textSizes[size]} font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-sans`}
            >
              Link
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
