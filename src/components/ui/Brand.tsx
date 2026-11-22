// Marca do app (coração com check) e ilustração da abertura (mãe e filhos), desenhadas em SVG.
import React from 'react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path
      d="M32 55 C 14 42, 6 33, 6 22 C 6 14, 12 8, 20 8 C 25 8, 29.5 10.5, 32 14.5 C 34.5 10.5, 39 8, 44 8 C 52 8, 58 14, 58 22 C 58 33, 50 42, 32 55 Z"
      fill="none"
      stroke="#B78A58"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path d="M21 30 L 29 38 L 44 23" fill="none" stroke="#B78A58" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 4 C 51 8, 52 9, 56 10 C 52 11, 51 12, 50 16 C 49 12, 48 11, 44 10 C 48 9, 49 8, 50 4 Z" fill="#E6C8A8" />
  </svg>
);

export const BrandName: React.FC<{ className?: string }> = ({ className = 'text-[34px]' }) => (
  <span className={`font-bold tracking-tight text-[#3A2619] ${className}`}>
    Rotina<span className="text-[#B78A58]">.ai</span>
  </span>
);

/** Ilustração suave: mãe abraçando duas crianças, com sol e folhas. Original, sem referência a personagens. */
export const FamilyIllustration: React.FC<{ className?: string }> = ({ className = 'w-full max-w-[300px]' }) => (
  <svg viewBox="0 0 320 240" className={className} aria-hidden="true">
    {/* fundo */}
    <ellipse cx="160" cy="150" rx="150" ry="88" fill="#F7D6B6" opacity="0.55" />
    <circle cx="250" cy="62" r="26" fill="#E6C8A8" />
    {/* folhas */}
    <path d="M38 196 C 30 160, 46 132, 66 120 C 70 150, 60 178, 38 196 Z" fill="#C9D8C3" />
    <path d="M58 200 C 60 172, 78 152, 98 148 C 94 174, 80 192, 58 200 Z" fill="#B7CCB0" />
    <path d="M282 200 C 292 168, 280 140, 262 128 C 256 158, 262 184, 282 200 Z" fill="#C9D8C3" />
    {/* mãe */}
    <path d="M118 236 C 112 186, 128 150, 162 146 C 196 150, 212 186, 206 236 Z" fill="#C38B5A" />
    <circle cx="162" cy="112" r="28" fill="#F1D3BC" />
    <path d="M132 112 C 128 82, 150 70, 166 72 C 190 74, 198 96, 192 118 C 186 100, 172 92, 156 96 C 144 99, 138 106, 132 112 Z" fill="#6B4430" />
    <path d="M190 104 C 202 118, 200 142, 192 152 C 188 136, 190 120, 190 104 Z" fill="#6B4430" />
    {/* criança 1 (esquerda) */}
    <path d="M86 236 C 84 204, 94 184, 116 182 C 136 184, 144 204, 142 236 Z" fill="#E6A97E" />
    <circle cx="114" cy="160" r="20" fill="#F4DCC8" />
    <path d="M94 156 C 94 138, 108 132, 118 134 C 132 136, 136 148, 134 158 C 126 148, 112 146, 94 156 Z" fill="#8A5A3C" />
    {/* criança 2 (direita) */}
    <path d="M182 236 C 180 210, 190 194, 210 192 C 230 194, 238 210, 236 236 Z" fill="#D9B48F" />
    <circle cx="210" cy="172" r="18" fill="#F4DCC8" />
    <path d="M192 170 C 190 152, 204 146, 214 148 C 226 150, 230 160, 228 170 C 222 160, 206 158, 192 170 Z" fill="#5E3B28" />
    <circle cx="196" cy="166" r="6" fill="#5E3B28" />
    <circle cx="226" cy="166" r="6" fill="#5E3B28" />
    {/* braços (abraço) */}
    <path d="M128 192 C 120 200, 118 212, 126 220" fill="none" stroke="#B4793F" strokeWidth="9" strokeLinecap="round" />
    <path d="M196 192 C 204 200, 206 212, 198 220" fill="none" stroke="#B4793F" strokeWidth="9" strokeLinecap="round" />
    {/* rostos */}
    <circle cx="154" cy="114" r="2.2" fill="#5E3B28" />
    <circle cx="170" cy="114" r="2.2" fill="#5E3B28" />
    <path d="M155 124 C 159 128, 165 128, 169 124" fill="none" stroke="#5E3B28" strokeWidth="2" strokeLinecap="round" />
    <circle cx="108" cy="162" r="1.8" fill="#5E3B28" />
    <circle cx="120" cy="162" r="1.8" fill="#5E3B28" />
    <path d="M109 170 C 112 173, 116 173, 119 170" fill="none" stroke="#5E3B28" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="204" cy="174" r="1.8" fill="#5E3B28" />
    <circle cx="216" cy="174" r="1.8" fill="#5E3B28" />
    <path d="M205 181 C 208 184, 212 184, 215 181" fill="none" stroke="#5E3B28" strokeWidth="1.8" strokeLinecap="round" />
    {/* coraçãozinho */}
    <path d="M160 52 C 154 46, 146 50, 148 57 C 150 63, 160 68, 160 68 C 160 68, 170 63, 172 57 C 174 50, 166 46, 160 52 Z" fill="#E6A97E" />
  </svg>
);
