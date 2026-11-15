import { Database, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { BrandMark } from './BrandMark';

export function AboutView() {
  const { branding } = useAppContext();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#293952]">
          <BrandMark branding={branding} variant="about" />
          <div className="text-xs font-mono text-[#38BDF8]">
            Official Logo v{branding.logoVersion}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1.5">
            <div className="text-xs text-[#CBD5E1]">Organization</div>
            <div className="font-semibold text-white">{branding.organizationName}</div>
            <div className="text-xs text-[#CBD5E1]">{branding.applicationSubtitle}</div>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-[#CBD5E1]">Institutional Contact</div>
            <div className="font-semibold text-white">{branding.contactEmail}</div>
            <div className="text-xs text-[#CBD5E1]">{branding.contactPhone}</div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#293952] text-xs text-[#CBD5E1]">
          {branding.institutionalFooter}
        </div>
      </div>

      {/* Persistence & Storage Architecture Documentation (Section 37) */}
      <div className="bg-[#151F30] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-white">
          <Database className="w-5 h-5 text-[#38BDF8]" />
          Database & File Storage Architecture
        </div>
        <p className="text-xs text-[#CBD5E1] leading-relaxed">
          KAWSAY NOVA persists normalized relational records across{' '}
          <span className="font-mono text-white">
            users, user_profiles, user_roles, user_permissions, user_preferences, user_avatars,
            app_branding, branding_history, audit_logs
          </span>
          , and biomedical telemetry tables using SQLite (<span className="font-mono">data/kawsay_nova.db</span>)
          with foreign-key constraints and disk-backed binary image storage (<span className="font-mono">data/uploads/</span>).
        </p>
        <div className="flex items-start gap-2.5 text-xs text-[#CBD5E1] p-3.5 rounded-lg bg-[#0B1220] border border-[#293952]">
          <ShieldCheck className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
          <span>
            <strong>Local Development Storage Note:</strong> Uploaded avatars and institutional
            logos are written to local filesystem storage rather than database text columns, and
            can be migrated directly to Cloud SQL / PostgreSQL and S3/GCS object storage via the
            storage helper interface in <span className="font-mono">server/auth.ts</span>.
          </span>
        </div>
      </div>
    </div>
  );
}
