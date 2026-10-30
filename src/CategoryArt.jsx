// Ilistrasyon (SVG) pou kategori metòd depo/retrè yo — gradyan, limyè, lonbraj.
// Chak ilistrasyon gen pwòp id gradyan li (prefiks) pou yo pa antre an konfli.
import React from 'react';

export function MobileWalletArt({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mw-body" x1="14" y1="6" x2="44" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B5FA8" /><stop offset="1" stopColor="#0E2A55" />
        </linearGradient>
        <linearGradient id="mw-screen" x1="18" y1="12" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5FD3F7" /><stop offset="1" stopColor="#1C8FD0" />
        </linearGradient>
        <linearGradient id="mw-coin" x1="38" y1="34" x2="58" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE07A" /><stop offset=".55" stopColor="#F5B323" /><stop offset="1" stopColor="#D98B1D" />
        </linearGradient>
        <filter id="mw-sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0E2A55" floodOpacity=".28" /></filter>
      </defs>
      <ellipse cx="32" cy="59" rx="20" ry="2.6" fill="#0E2A55" opacity=".12" />
      <g filter="url(#mw-sh)" transform="rotate(-8 30 32)">
        <rect x="15" y="6" width="28" height="50" rx="7" fill="url(#mw-body)" />
        <rect x="18" y="11" width="22" height="38" rx="3.5" fill="url(#mw-screen)" />
        <rect x="25" y="8" width="8" height="1.6" rx=".8" fill="#5D82BC" />
        <rect x="21" y="15" width="16" height="9" rx="2.5" fill="#fff" opacity=".95" />
        <rect x="23" y="17.5" width="7" height="1.6" rx=".8" fill="#1C8FD0" />
        <rect x="23" y="20.5" width="11" height="1.6" rx=".8" fill="#9CC9EA" />
        <rect x="21" y="27" width="7" height="7" rx="2" fill="#fff" opacity=".35" />
        <rect x="30" y="27" width="7" height="7" rx="2" fill="#fff" opacity=".35" />
        <rect x="21" y="36" width="7" height="7" rx="2" fill="#fff" opacity=".35" />
        <path d="M18 11h22l-22 20z" fill="#fff" opacity=".14" />
        <rect x="26" y="51.5" width="6" height="1.6" rx=".8" fill="#5D82BC" />
      </g>
      <g filter="url(#mw-sh)">
        <circle cx="47" cy="44" r="10.5" fill="url(#mw-coin)" />
        <circle cx="47" cy="44" r="7.6" fill="none" stroke="#FFF3C4" strokeWidth="1.2" opacity=".8" />
        <text x="47" y="48" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#8A5A0B" fontFamily="Inter, Arial, sans-serif">G</text>
      </g>
      <path d="M50 10c3 2 4.6 5 4.6 8.6M53.6 6.4c4.3 3 6.6 7.4 6.6 12.4" stroke="#29B6E8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BankArt({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bk-roof" x1="32" y1="6" x2="32" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B5FA8" /><stop offset="1" stopColor="#143A73" />
        </linearGradient>
        <linearGradient id="bk-col" x1="0" y1="24" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#D6E4F5" />
        </linearGradient>
        <linearGradient id="bk-base" x1="10" y1="48" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1C4F96" /><stop offset="1" stopColor="#0E2A55" />
        </linearGradient>
        <linearGradient id="bk-gold" x1="26" y1="10" x2="38" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE07A" /><stop offset="1" stopColor="#D98B1D" />
        </linearGradient>
        <filter id="bk-sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0E2A55" floodOpacity=".25" /></filter>
      </defs>
      <ellipse cx="32" cy="59" rx="22" ry="2.6" fill="#0E2A55" opacity=".12" />
      <g filter="url(#bk-sh)">
        <path d="M32 5 56 19.5c.9.6.5 2-.6 2H8.6c-1.1 0-1.5-1.4-.6-2Z" fill="url(#bk-roof)" />
        <path d="M32 5 56 19.5c.9.6.5 2-.6 2H32Z" fill="#000" opacity=".12" />
        <circle cx="32" cy="15" r="4.6" fill="url(#bk-gold)" />
        <text x="32" y="18.2" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#8A5A0B" fontFamily="Inter, Arial, sans-serif">G</text>
        <rect x="10" y="22.5" width="44" height="3.4" rx="1" fill="#1C4F96" />
        {[13.5, 23.5, 33.5, 43.5].map((x) => (
          <g key={x}>
            <rect x={x} y="27" width="7" height="20" rx="1.2" fill="url(#bk-col)" />
            <rect x={x + 4.6} y="27" width="2.4" height="20" rx="1" fill="#B9CDE8" opacity=".7" />
          </g>
        ))}
        <rect x="8" y="47.5" width="48" height="4" rx="1.4" fill="url(#bk-base)" />
        <rect x="5" y="52" width="54" height="4" rx="1.6" fill="url(#bk-base)" />
      </g>
    </svg>
  );
}

export function OtherArt({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ot-bill" x1="6" y1="20" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3CC69B" /><stop offset="1" stopColor="#14805F" />
        </linearGradient>
        <linearGradient id="ot-bill2" x1="10" y1="14" x2="50" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6FDDB8" /><stop offset="1" stopColor="#1E9E7C" />
        </linearGradient>
        <linearGradient id="ot-coin" x1="36" y1="30" x2="60" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE07A" /><stop offset=".55" stopColor="#F5B323" /><stop offset="1" stopColor="#D98B1D" />
        </linearGradient>
        <linearGradient id="ot-usdt" x1="40" y1="4" x2="60" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4FD1A9" /><stop offset="1" stopColor="#1A8F6E" />
        </linearGradient>
        <filter id="ot-sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0B3D2E" floodOpacity=".25" /></filter>
      </defs>
      <ellipse cx="30" cy="59" rx="22" ry="2.6" fill="#0E2A55" opacity=".12" />
      <g filter="url(#ot-sh)">
        <rect x="9" y="15" width="38" height="22" rx="4" transform="rotate(-10 28 26)" fill="url(#ot-bill2)" />
        <rect x="5" y="23" width="40" height="23" rx="4" fill="url(#ot-bill)" />
        <rect x="8.5" y="26.5" width="33" height="16" rx="2.5" fill="none" stroke="#B8F0DC" strokeWidth="1" opacity=".7" />
        <circle cx="25" cy="34.5" r="5.4" fill="#B8F0DC" opacity=".9" />
        <text x="25" y="37.6" textAnchor="middle" fontSize="8" fontWeight="800" fill="#14805F" fontFamily="Inter, Arial, sans-serif">G</text>
      </g>
      <g filter="url(#ot-sh)">
        <ellipse cx="47" cy="53" rx="10" ry="3.6" fill="#B87411" />
        <rect x="37" y="46" width="20" height="7" fill="#D98B1D" />
        <ellipse cx="47" cy="46" rx="10" ry="3.6" fill="#C9821A" />
        <rect x="37" y="40" width="20" height="6" fill="#E59D22" />
        <ellipse cx="47" cy="40" rx="10" ry="3.6" fill="url(#ot-coin)" />
        <ellipse cx="47" cy="40" rx="6.4" ry="2.1" fill="none" stroke="#FFF3C4" strokeWidth="1" opacity=".8" />
      </g>
    </svg>
  );
}

export const CATEGORY_ART = { mobile: MobileWalletArt, bank: BankArt, other: OtherArt };
