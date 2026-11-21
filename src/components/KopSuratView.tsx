import React from 'react';
import { KopSuratConfig } from '../utils/ptjEngine';

interface KopSuratViewProps {
  kop: KopSuratConfig;
  compact?: boolean;
}

/**
 * Lambang Pengayoman Kementerian Hukum RI (Vector SVG Presisi Tinggi untuk Cetak A4)
 */
export const PengayomanEmblemSvg: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20',
}) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo Pengayoman Kementerian Hukum RI"
  >
    {/* Navy Blue Square Background */}
    <rect x="4" y="4" width="112" height="112" rx="2" fill="#0B2265" />
    {/* Golden Banyan Tree (Pohon Beringin Pengayoman) Canopy */}
    <path
      d="M46 28C46 20.5 52.3 15 60 15C67.7 15 74 20.5 74 28"
      stroke="#F5B800"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M31 41C31 33.5 37.5 28 45.5 28C51.2 28 56 31 58 35.5"
      stroke="#F5B800"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M89 41C89 33.5 82.5 28 74.5 28C68.8 28 64 31 62 35.5"
      stroke="#F5B800"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M18 55C18 46.5 25 40 33.5 40C40.5 40 46.2 44.5 48 51"
      stroke="#F5B800"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M102 55C102 46.5 95 40 86.5 40C79.5 40 73.8 44.5 72 51"
      stroke="#F5B800"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Vertical Trunk & Hanging Roots (5 Pillars) */}
    <path
      d="M58 34V94M62 34V94"
      stroke="#F5B800"
      strokeWidth="3.8"
      strokeLinecap="round"
    />
    <path
      d="M52 44V94M68 44V94"
      stroke="#F5B800"
      strokeWidth="3.8"
      strokeLinecap="round"
    />
    {/* Outer Root Pillars with Horizontal Base */}
    <path
      d="M32 94H46V52M88 94H74V52"
      stroke="#F5B800"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* PENGAYOMAN Text */}
    <text
      x="60"
      y="107"
      textAnchor="middle"
      fill="#F5B800"
      fontSize="9.5"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
      letterSpacing="1.2"
    >
      PENGAYOMAN
    </text>
  </svg>
);

export const KopSuratView: React.FC<KopSuratViewProps> = ({ kop, compact = false }) => {
  return (
    <div
      className={`w-full border-b-2 border-black pb-2.5 mb-5 ${
        compact ? 'text-xs' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Emblem / Logo */}
        <div className="shrink-0 flex items-center justify-center w-24 h-20 pl-2">
          {kop.logoPreset === 'pengayoman' || !kop.logoPreset ? (
            <PengayomanEmblemSvg className="w-20 h-20" />
          ) : kop.logoPreset === 'custom' &&
            kop.customLogoDataUrl &&
            kop.customLogoDataUrl.startsWith('data:image') ? (
            <img
              src={kop.customLogoDataUrl}
              alt="Logo Instansi"
              referrerPolicy="no-referrer"
              className="w-20 h-20 object-contain"
            />
          ) : kop.logoPreset === 'instansi' ? (
            <svg
              viewBox="0 0 80 80"
              className="w-16 h-16 text-slate-900"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 6L68 18V39C68 57.5 55.8 70.2 40 75C24.2 70.2 12 57.5 12 39V18L40 6Z"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="#f8fafc"
              />
              <path
                d="M40 14L60 22.5V38.5C60 52.2 51.2 61.8 40 65.8C28.8 61.8 20 52.2 20 38.5V22.5L40 14Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M28 48H52M32 54H48M40 22V48"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="40" cy="38" r="6" fill="currentColor" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 80 80"
              className="w-16 h-16 text-slate-900"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="2.2" fill="#f8fafc" />
              <circle cx="40" cy="40" r="29" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
              <path
                d="M16 34C22 25 30 24 40 28C50 24 58 25 64 34C59 42 52 46 40 48C28 46 21 42 16 34Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="#e2e8f0"
              />
              <path
                d="M40 26L49 30V41C49 47.5 45.2 52.5 40 55C34.8 52.5 31 47.5 31 41V30L40 26Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="#ffffff"
              />
              <path d="M40 26V55M31 40H49" stroke="currentColor" strokeWidth="1.5" />
              <polygon points="40,36 42,40 40,44 38,40" fill="currentColor" />
              <path
                d="M24 58C31 62 49 62 56 58"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Header Text Matching image_1e1f04df.png & SPTJM_78456032.pdf */}
        <div className="flex-1 text-center pr-6 text-black leading-snug">
          <div className="text-xs sm:text-[13px] font-normal uppercase tracking-wide">
            {kop.kementerian || 'KEMENTERIAN HUKUM REPUBLIK INDONESIA'}
          </div>
          <div className="text-xs sm:text-[13px] font-bold uppercase tracking-wide mt-0.5">
            {kop.eselon1 || 'INSPEKTORAT JENDERAL'}
          </div>
          {kop.satkerName && (
            <div className="text-xs font-bold uppercase mt-0.5">
              {kop.satkerName}
            </div>
          )}
          <div className="text-xs mt-0.5">{kop.alamat}</div>
          <div className="text-xs">{kop.teleponEmail}</div>
          {kop.website && <div className="text-xs">{kop.website}</div>}
        </div>
      </div>
    </div>
  );
};
