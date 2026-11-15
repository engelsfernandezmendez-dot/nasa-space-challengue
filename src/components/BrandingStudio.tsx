import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ImagePlus,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sliders,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BrandingHistoryEntry } from '../types/kawsay';
import {
  computeAspectRatioDimensions,
  hasPermission,
  sanitizeSvgContent,
  validateLogoFile,
} from '../utils/validation';
import { apiFetch } from '../utils/authToken';

type AspectOption = 'original' | '1:1' | '16:9' | '4:3';
type FitOption = 'contain' | 'cover';
type BgOption = 'dark' | 'card' | 'light' | 'checker';

export function BrandingStudio() {
  const { user, branding, setBranding, t } = useAppContext();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const reportLogoInputRef = useRef<HTMLInputElement | null>(null);

  const canManageBranding = user ? hasPermission(user.role, 'manage_application_branding') : false;

  const [history, setHistory] = useState<BrandingHistoryEntry[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Pending Logo Preview & Adjustment Workbench state
  const [pendingRawDataUrl, setPendingRawDataUrl] = useState<string | null>(null);
  const [pendingMimeType, setPendingMimeType] = useState<string>('');
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [isSvgLogo, setIsSvgLogo] = useState(false);

  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectOption>(branding.logoAspectRatio);
  const [fitMode, setFitMode] = useState<FitOption>(branding.logoFit);
  const [previewBg, setPreviewBg] = useState<BgOption>('dark');
  const [logoHeight, setLogoHeight] = useState<number>(branding.logoDisplayHeight);
  const [syncFavicon, setSyncFavicon] = useState<boolean>(true);
  const [syncReportLogo, setSyncReportLogo] = useState<boolean>(true);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 256, h: 256 });
  const [savingLogo, setSavingLogo] = useState(false);

  // Additional Branding Metadata State
  const [subtitle, setSubtitle] = useState(branding.applicationSubtitle);
  const [orgName, setOrgName] = useState(branding.organizationName);
  const [footerText, setFooterText] = useState(branding.institutionalFooter);
  const [contactEmail, setContactEmail] = useState(branding.contactEmail);
  const [contactPhone, setContactPhone] = useState(branding.contactPhone);
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    setSubtitle(branding.applicationSubtitle);
    setOrgName(branding.organizationName);
    setFooterText(branding.institutionalFooter);
    setContactEmail(branding.contactEmail);
    setContactPhone(branding.contactPhone);
  }, [branding]);

  useEffect(() => {
    if (!canManageBranding) return;
    apiFetch('/api/branding/history', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.history) setHistory(d.history);
      })
      .catch(() => {});
  }, [canManageBranding, branding.logoVersion]);

  if (!canManageBranding) {
    return (
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              Official Branding & Identity Locked
            </h3>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              Only authorized System Administrators can modify the official KAWSAY NOVA
              application logo, favicon, or institutional branding. You may customize your
              personal profile photograph independently from your My Profile page.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#151F30] border border-[#293952] flex items-center gap-4">
          <img
            src={`${branding.logoStoragePath}?v=${branding.logoVersion}`}
            alt="Active KAWSAY NOVA official logo"
            className="h-10 w-auto object-contain"
          />
          <div className="text-xs text-[#CBD5E1]">
            <div className="font-semibold text-white">KAWSAY NOVA</div>
            <div>{branding.organizationName} · Logo v{branding.logoVersion}</div>
          </div>
        </div>
      </div>
    );
  }

  function handleSelectLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateLogoFile({ name: file.name, type: file.type, size: file.size });
    if (!check.valid) {
      setFeedback({ type: 'error', text: check.error || 'Invalid logo file.' });
      return;
    }

    const isSvg =
      file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = () => {
        const rawText = String(reader.result || '');
        const clean = sanitizeSvgContent(rawText);
        if (!clean.safe) {
          setFeedback({ type: 'error', text: clean.reason || 'Unsafe SVG rejected.' });
          return;
        }
        const encoded = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(clean.sanitized)))}`;
        setIsSvgLogo(true);
        setPendingRawDataUrl(encoded);
        setPendingMimeType('image/svg+xml');
        setPendingFileName(file.name);
        setCropZoom(1);
        setCropOffsetX(0);
        setCropOffsetY(0);
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth || 256, h: img.naturalHeight || 256 });
        setIsSvgLogo(false);
        setPendingRawDataUrl(dataUrl);
        setPendingMimeType(file.type || 'image/png');
        setPendingFileName(file.name);
        setCropZoom(1);
        setCropOffsetX(0);
        setCropOffsetY(0);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  async function renderCroppedRasterDataUrl(): Promise<{ dataUrl: string; mimeType: string }> {
    if (!pendingRawDataUrl) {
      throw new Error('No pending image selected');
    }
    if (isSvgLogo || (cropZoom === 1 && cropOffsetX === 0 && cropOffsetY === 0 && aspectRatio === 'original')) {
      return { dataUrl: pendingRawDataUrl, mimeType: pendingMimeType };
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = pendingRawDataUrl;
    });

    const targetDims = computeAspectRatioDimensions(
      aspectRatio,
      img.naturalWidth,
      img.naturalHeight
    );
    const maxEdge = 1024;
    const scaleDown = Math.min(1, maxEdge / Math.max(targetDims.width, targetDims.height));
    const outW = Math.max(64, Math.round(targetDims.width * scaleDown));
    const outH = Math.max(64, Math.round(targetDims.height * scaleDown));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, outW, outH);

    const baseScale =
      fitMode === 'cover'
        ? Math.max(outW / img.naturalWidth, outH / img.naturalHeight)
        : Math.min(outW / img.naturalWidth, outH / img.naturalHeight);
    const drawW = img.naturalWidth * baseScale * cropZoom;
    const drawH = img.naturalHeight * baseScale * cropZoom;
    const dx = (outW - drawW) / 2 + (cropOffsetX / 100) * outW * 0.4;
    const dy = (outH - drawH) / 2 + (cropOffsetY / 100) * outH * 0.4;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, drawW, drawH);

    const outMime = pendingMimeType === 'image/webp' ? 'image/webp' : 'image/png';
    return { dataUrl: canvas.toDataURL(outMime, 0.95), mimeType: outMime };
  }

  async function handleSaveNewLogo() {
    if (!pendingRawDataUrl) return;
    setSavingLogo(true);
    setFeedback(null);
    try {
      const prepared = await renderCroppedRasterDataUrl();
      const res = await apiFetch('/api/branding/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dataUrl: prepared.dataUrl,
          mimeType: prepared.mimeType,
          logoFit: fitMode,
          logoAspectRatio: aspectRatio,
          logoDisplayHeight: logoHeight,
          syncFavicon,
          syncReportLogo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to save logo.' });
        return;
      }
      setBranding(data.branding);
      if (data.history) setHistory(data.history);
      setPendingRawDataUrl(null);
      setPendingFileName('');
      if (logoInputRef.current) logoInputRef.current.value = '';
      setFeedback({
        type: 'success',
        text: `Official KAWSAY NOVA logo updated to v${data.branding.logoVersion} and synchronized globally.`,
      });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to process or upload logo image.' });
    } finally {
      setSavingLogo(false);
    }
  }

  async function handleRestoreOriginalLogo() {
    setSavingLogo(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/api/branding/restore', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Unable to restore original logo.' });
        return;
      }
      setBranding(data.branding);
      if (data.history) setHistory(data.history);
      setPendingRawDataUrl(null);
      setAspectRatio('original');
      setFitMode('contain');
      setLogoHeight(36);
      setFeedback({
        type: 'success',
        text: 'Restored original KAWSAY NOVA official default logo across all application surfaces.',
      });
    } catch {
      setFeedback({ type: 'error', text: 'Error restoring original logo.' });
    } finally {
      setSavingLogo(false);
    }
  }

  async function handleAuxiliaryUpload(
    endpoint: '/api/branding/favicon' | '/api/branding/report-logo',
    file: File | undefined,
    label: string
  ) {
    if (!file) return;
    const check = validateLogoFile({ name: file.name, type: file.type, size: file.size });
    if (!check.valid) {
      setFeedback({ type: 'error', text: check.error || 'Invalid file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            dataUrl: String(reader.result || ''),
            mimeType: file.type || 'image/png',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFeedback({ type: 'error', text: data.error || `Failed to update ${label}.` });
          return;
        }
        setBranding(data.branding);
        setFeedback({ type: 'success', text: `${label} updated and synchronized.` });
      } catch {
        setFeedback({ type: 'error', text: `Failed to upload ${label}.` });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveBrandingMetadata(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/api/branding/metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          applicationSubtitle: subtitle,
          organizationName: orgName,
          institutionalFooter: footerText,
          contactEmail,
          contactPhone,
          logoFit: fitMode,
          logoAspectRatio: aspectRatio,
          logoDisplayHeight: logoHeight,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to update branding settings.' });
        return;
      }
      setBranding(data.branding);
      setFeedback({
        type: 'success',
        text: 'Institutional branding customization saved.',
      });
    } catch {
      setFeedback({ type: 'error', text: 'Network error updating branding metadata.' });
    } finally {
      setSavingMeta(false);
    }
  }

  const previewBgClass =
    previewBg === 'light'
      ? 'bg-white text-[#0B1220]'
      : previewBg === 'card'
        ? 'bg-[#1D2A3D] text-white'
        : previewBg === 'checker'
          ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] bg-[#0F172A] text-white'
          : 'bg-[#0B1220] text-white';

  const aspectBoxClass =
    aspectRatio === '1:1'
      ? 'aspect-square w-36'
      : aspectRatio === '16:9'
        ? 'aspect-video w-56'
        : aspectRatio === '4:3'
          ? 'aspect-[4/3] w-48'
          : 'w-auto max-w-[240px]';

  const activePreviewSrc = pendingRawDataUrl
    ? pendingRawDataUrl
    : `${branding.logoStoragePath}?v=${branding.logoVersion}`;

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-lg border text-sm ${
            feedback.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Section: APPLICATION LOGO */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#293952]">
          <div>
            <div className="text-xs font-mono text-[#38BDF8] mb-1">
              APPLICATION LOGO · VERSION {branding.logoVersion}
            </div>
            <h3 className="text-lg font-semibold text-white">
              Official KAWSAY NOVA Logo Management
            </h3>
            <p className="text-xs text-[#CBD5E1] mt-1">
              Select a local image file (PNG, JPG, JPEG, WEBP, or sanitized SVG) directly from
              your device. Changes synchronize automatically across navigation, login, dashboard,
              favicon, and PDF reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={logoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleSelectLogoFile}
              className="hidden"
              aria-label="Select application logo file from device"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <ImagePlus className="w-4 h-4" />
              {t.changeApplicationLogo}
            </button>
            <button
              type="button"
              onClick={handleRestoreOriginalLogo}
              disabled={savingLogo}
              className="px-3.5 py-2.5 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] text-xs font-medium text-[#CBD5E1] hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.restoreOriginalLogo}
            </button>
          </div>
        </div>

        {/* Preview and Adjustment Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live Background & Sizing Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#CBD5E1]">
                {pendingRawDataUrl
                  ? `Previewing Selected File: ${pendingFileName}`
                  : 'Active Synchronized Logo Preview'}
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#151F30] border border-[#293952]">
                {(['dark', 'card', 'light', 'checker'] as BgOption[]).map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setPreviewBg(bg)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                      previewBg === bg
                        ? 'bg-[#38BDF8] text-[#0B1220]'
                        : 'text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`min-h-[220px] rounded-xl border border-[#293952] p-6 flex flex-col items-center justify-center gap-5 transition-colors ${previewBgClass}`}
            >
              {/* Simulated Header Lockup Preview */}
              <div className="flex items-center gap-3">
                <div
                  className={`overflow-hidden rounded-lg flex items-center justify-center ${aspectBoxClass}`}
                  style={{ height: `${logoHeight}px` }}
                >
                  <img
                    src={activePreviewSrc}
                    alt="Application logo preview"
                    className={`h-full w-full ${
                      fitMode === 'cover' ? 'object-cover' : 'object-contain'
                    }`}
                    style={
                      pendingRawDataUrl && !isSvgLogo
                        ? {
                            transform: `scale(${cropZoom}) translate(${cropOffsetX * 0.4}%, ${
                              cropOffsetY * 0.4
                            }%)`,
                          }
                        : undefined
                    }
                  />
                </div>
                <span
                  className="text-lg font-semibold tracking-tight whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  KAWSAY NOVA
                </span>
              </div>

              <div
                className={`text-xs font-mono tabular-nums ${
                  previewBg === 'light' ? 'text-slate-600' : 'text-[#CBD5E1]'
                }`}
              >
                Height: {logoHeight}px · Fit: {fitMode} · Ratio: {aspectRatio}
                {pendingRawDataUrl && !isSvgLogo
                  ? ` · Source: ${naturalSize.w}×${naturalSize.h}px`
                  : ''}
              </div>
            </div>

            {pendingRawDataUrl && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#151F30] border border-[#38BDF8]/40">
                <div className="space-y-1 text-xs text-[#CBD5E1]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncFavicon}
                      onChange={(e) => setSyncFavicon(e.target.checked)}
                      className="rounded border-[#293952]"
                    />
                    Synchronize browser favicon automatically
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncReportLogo}
                      onChange={(e) => setSyncReportLogo(e.target.checked)}
                      className="rounded border-[#293952]"
                    />
                    Synchronize PDF & medical report header logo
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingRawDataUrl(null);
                      setPendingFileName('');
                      if (logoInputRef.current) logoInputRef.current.value = '';
                    }}
                    className="px-3.5 py-2 rounded-lg border border-[#293952] text-xs font-medium text-[#CBD5E1] hover:text-white flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewLogo}
                    disabled={savingLogo}
                    className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {savingLogo ? 'Saving Logo...' : 'Confirm & Save Logo'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cropping, Aspect Ratio, Fit & Size Controls */}
          <div className="lg:col-span-5 bg-[#151F30] border border-[#293952] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sliders className="w-4 h-4 text-[#38BDF8]" />
              Logo Preview & Adjustment Controls
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Aspect Ratio Framing
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['original', '1:1', '16:9', '4:3'] as AspectOption[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]'
                        : 'bg-[#0B1220] border-[#293952] text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Fit & Contain Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['contain', 'cover'] as FitOption[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFitMode(mode)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${
                      fitMode === mode
                        ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]'
                        : 'bg-[#0B1220] border-[#293952] text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    {mode === 'contain' ? 'Contain (No Crop)' : 'Cover (Fill Frame)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#CBD5E1] mb-1">
                <span>Display Size (Header Height)</span>
                <span className="font-mono tabular-nums text-white">{logoHeight}px</span>
              </div>
              <input
                type="range"
                min={24}
                max={64}
                value={logoHeight}
                onChange={(e) => setLogoHeight(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>

            {pendingRawDataUrl && !isSvgLogo && (
              <div className="pt-3 border-t border-[#293952] space-y-3">
                <div className="text-xs font-medium text-[#38BDF8]">
                  Raster Image Crop Framing
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#CBD5E1] mb-1">
                    <span>Crop Zoom</span>
                    <span className="font-mono tabular-nums">{cropZoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.05}
                    value={cropZoom}
                    onChange={(e) => setCropZoom(Number(e.target.value))}
                    className="w-full accent-[#38BDF8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#CBD5E1] mb-1">
                      <span>Pan X</span>
                      <span className="font-mono tabular-nums">{cropOffsetX}%</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={cropOffsetX}
                      onChange={(e) => setCropOffsetX(Number(e.target.value))}
                      className="w-full accent-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-[#CBD5E1] mb-1">
                      <span>Pan Y</span>
                      <span className="font-mono tabular-nums">{cropOffsetY}%</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={cropOffsetY}
                      onChange={(e) => setCropOffsetY(Number(e.target.value))}
                      className="w-full accent-[#38BDF8]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Optional Branding Customization */}
      <form
        onSubmit={handleSaveBrandingMetadata}
        className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-[#293952] pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Institutional Identity & Report Assets
            </h3>
            <p className="text-xs text-[#CBD5E1] mt-0.5">
              Customize subtitle, organization, footer, favicon, and report headers. The core
              application name remains <strong className="text-white">KAWSAY NOVA</strong>.
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#38BDF8] shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
              Application Name (Immutable)
            </label>
            <input
              type="text"
              value="KAWSAY NOVA"
              disabled
              className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220]/70 border border-[#293952] text-slate-400 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="brand-subtitle"
              className="block text-xs font-medium text-[#CBD5E1] mb-1"
            >
              Application Subtitle
            </label>
            <input
              id="brand-subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <div>
            <label htmlFor="brand-org" className="block text-xs font-medium text-[#CBD5E1] mb-1">
              Organization Name
            </label>
            <input
              id="brand-org"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-footer"
              className="block text-xs font-medium text-[#CBD5E1] mb-1"
            >
              Institutional Footer
            </label>
            <input
              id="brand-footer"
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-email"
              className="block text-xs font-medium text-[#CBD5E1] mb-1"
            >
              Contact Email
            </label>
            <input
              id="brand-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-phone"
              className="block text-xs font-medium text-[#CBD5E1] mb-1"
            >
              Contact Information (Phone / Desk)
            </label>
            <input
              id="brand-phone"
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </div>

        {/* Dedicated Favicon & Report Logo Uploaders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={`${branding.faviconStoragePath}?v=${branding.logoVersion}`}
                alt="Active favicon"
                className="h-8 w-8 rounded object-contain bg-[#0B1220] p-1 border border-[#293952]"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-white">Browser Favicon</div>
                <div className="text-[11px] text-[#CBD5E1] truncate font-mono">
                  {branding.faviconStoragePath}
                </div>
              </div>
            </div>
            <input
              ref={faviconInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={(e) =>
                handleAuxiliaryUpload('/api/branding/favicon', e.target.files?.[0], 'Favicon')
              }
              className="hidden"
            />
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-[#38BDF8]/40 text-xs text-[#38BDF8] hover:bg-[#38BDF8]/10 whitespace-nowrap"
            >
              Upload Favicon
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={`${branding.reportLogoStoragePath}?v=${branding.logoVersion}`}
                alt="Active report logo"
                className="h-8 w-8 rounded object-contain bg-white p-1 border border-[#293952]"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-white">Medical Report Header Logo</div>
                <div className="text-[11px] text-[#CBD5E1] truncate font-mono">
                  {branding.reportLogoStoragePath}
                </div>
              </div>
            </div>
            <input
              ref={reportLogoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={(e) =>
                handleAuxiliaryUpload(
                  '/api/branding/report-logo',
                  e.target.files?.[0],
                  'Report Logo'
                )
              }
              className="hidden"
            />
            <button
              type="button"
              onClick={() => reportLogoInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-[#38BDF8]/40 text-xs text-[#38BDF8] hover:bg-[#38BDF8]/10 whitespace-nowrap"
            >
              Upload Report Logo
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingMeta}
            className="px-5 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {savingMeta ? 'Saving Settings...' : 'Save Branding Settings'}
          </button>
        </div>
      </form>

      {/* Branding Version History Table */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Branding Revision History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2.5 pr-4 font-medium">Version</th>
                <th className="py-2.5 pr-4 font-medium">Action</th>
                <th className="py-2.5 pr-4 font-medium">Storage Path</th>
                <th className="py-2.5 pr-4 font-medium">Updated By</th>
                <th className="py-2.5 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#151F30]/60">
                  <td className="py-2.5 pr-4 font-mono tabular-nums text-[#38BDF8]">
                    v{entry.logoVersion}
                  </td>
                  <td className="py-2.5 pr-4 text-white capitalize">
                    {entry.action.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[#CBD5E1]">
                    {entry.logoStoragePath}
                  </td>
                  <td className="py-2.5 pr-4 text-white">{entry.updatedByName}</td>
                  <td className="py-2.5 font-mono tabular-nums text-[#CBD5E1] text-right">
                    {new Date(entry.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
