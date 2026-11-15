import { useState } from 'react';
import type { AppBranding } from '../types/kawsay';

interface BrandMarkProps {
  branding: AppBranding;
  variant?: 'sidebar' | 'auth' | 'report' | 'loading' | 'about';
  useReportLogo?: boolean;
  lightSurface?: boolean;
}

export function BrandMark({
  branding,
  variant = 'sidebar',
  useReportLogo = false,
  lightSurface = false,
}: BrandMarkProps) {
  const [imgError, setImgError] = useState(false);

  const rawPath = useReportLogo
    ? branding.reportLogoStoragePath || branding.logoStoragePath
    : branding.logoStoragePath;
  const src = `${rawPath}?v=${branding.logoVersion}`;

  const heightPx =
    variant === 'loading'
      ? Math.max(48, Math.min(72, branding.logoDisplayHeight * 1.6))
      : variant === 'auth'
        ? Math.max(40, Math.min(56, branding.logoDisplayHeight * 1.25))
        : variant === 'report'
          ? Math.max(36, Math.min(54, branding.logoDisplayHeight * 1.2))
          : Math.max(24, Math.min(52, branding.logoDisplayHeight));

  const aspectClass =
    branding.logoAspectRatio === '1:1'
      ? 'aspect-square'
      : branding.logoAspectRatio === '16:9'
        ? 'aspect-video'
        : branding.logoAspectRatio === '4:3'
          ? 'aspect-[4/3]'
          : '';

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`shrink-0 overflow-hidden rounded-lg flex items-center justify-center ${aspectClass}`}
        style={{ height: `${heightPx}px`, maxWidth: '140px' }}
      >
        {!imgError ? (
          <img
            src={src}
            alt="KAWSAY NOVA official logo"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`h-full w-auto max-w-full ${
              branding.logoFit === 'cover' ? 'object-cover' : 'object-contain'
            }`}
          />
        ) : (
          <div className="h-full aspect-square rounded-lg bg-[#1D2A3D] border border-[#38BDF8]/40 flex items-center justify-center text-xs font-mono font-semibold text-[#38BDF8]">
            KN
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div
          className={`font-semibold tracking-tight whitespace-nowrap truncate ${
            variant === 'loading' || variant === 'auth' ? 'text-xl' : 'text-base'
          } ${lightSurface ? 'text-[#0B1220]' : 'text-white'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          KAWSAY NOVA
        </div>
        {(variant === 'auth' || variant === 'report' || variant === 'about') && (
          <div
            className={`text-xs leading-snug mt-0.5 ${
              lightSurface ? 'text-slate-600' : 'text-[#CBD5E1]'
            }`}
          >
            {branding.applicationSubtitle}
          </div>
        )}
      </div>
    </div>
  );
}
