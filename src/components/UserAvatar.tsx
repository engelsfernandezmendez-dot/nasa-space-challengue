import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  fullName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function UserAvatar({ src, fullName, size = 'md' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'KN';

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'md'
        ? 'h-10 w-10 text-sm'
        : size === 'lg'
          ? 'h-16 w-16 text-lg'
          : 'h-24 w-24 text-2xl';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${fullName} profile photograph`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeClass} rounded-full object-cover border border-[#38BDF8]/40 bg-[#151F30] shrink-0`}
      />
    );
  }

  return (
    <div
      aria-label={`${fullName} default avatar`}
      className={`${sizeClass} rounded-full bg-[#1D2A3D] border border-[#60A5FA]/40 text-[#38BDF8] font-semibold flex items-center justify-center shrink-0 select-none`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {initials}
    </div>
  );
}
