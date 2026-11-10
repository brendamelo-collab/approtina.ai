// Peças visuais dos relatórios. Todas recebem números já calculados a partir dos registros reais;
// quando não há dados, mostram "Sem dados suficientes" em vez de inventar valores.
import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Delta } from '../../utils/reportStats';

export const EmptyState: React.FC<{ text?: string; hint?: string }> = ({ text = 'Sem dados suficientes', hint }) => (
  <div className="rounded-2xl border border-dashed border-[#DDD3C5] bg-[#FAF8F5] px-3 py-4 text-center">
    <p className="text-xs font-bold text-[#5C4F44]">{text}</p>
    {hint && <p className="text-[11px] text-[#8C7A6B] mt-1 leading-snug">{hint}</p>}
  </div>
);

export const Card: React.FC<{ title?: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  subtitle,
  right,
  children,
  className = ''
}) => (
  <section className={`bg-white border border-[#EFE8DE] rounded-3xl p-4 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3 ${className}`}>
    {(title || right) && (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <h3 className="text-sm font-bold text-[#2C2C2C] leading-snug break-words">{title}</h3>}
          {subtitle && <p className="text-[11px] text-[#8C7A6B] leading-snug mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    )}
    {children}
  </section>
);

/** Número grande com legenda. `value` null = sem dados. */
export const Stat: React.FC<{ label: string; value: number | string | null; suffix?: string; tone?: 'ok' | 'bad' | 'neutral'; note?: React.ReactNode }> = ({
  label,
  value,
  suffix = '',
  tone = 'neutral',
  note
}) => {
  const color = tone === 'ok' ? 'text-[#2C5230]' : tone === 'bad' ? 'text-[#8C3A24]' : 'text-[#2C2C2C]';
  return (
    <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3 min-w-0">
      <p className="text-[11px] font-semibold text-[#8C7A6B] leading-tight break-words">{label}</p>
      <p className={`text-xl font-extrabold leading-tight mt-1 ${value === null ? 'text-[#B4A597]' : color}`}>
        {value === null ? '—' : `${value}${suffix}`}
      </p>
      {note && <div className="text-[10px] text-[#8C7A6B] leading-tight mt-1">{note}</div>}
    </div>
  );
};

/**
 * Variação em relação ao período anterior.
 * `higherIsBetter=false` para comportamentos a evitar (subir é ruim).
 */
export const DeltaBadge: React.FC<{ d: Delta; unit?: string; higherIsBetter?: boolean; label?: string }> = ({ d, unit = ' p.p.', higherIsBetter = true, label }) => {
  if (d.diff === null) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C7A6B] bg-[#F4EDE2] px-2 py-0.5 rounded-full whitespace-nowrap">sem comparação</span>;
  }
  const diff = Math.round(d.diff * 10) / 10;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5C4F44] bg-[#F4EDE2] px-2 py-0.5 rounded-full whitespace-nowrap">
        <Minus className="w-3 h-3" /> igual{label ? ` ${label}` : ''}
      </span>
    );
  }
  const up = diff > 0;
  const good = up === higherIsBetter;
  const cls = good ? 'text-[#2C5230] bg-[#EEF5EF]' : 'text-[#8C3A24] bg-[#FDF2EE]';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      <Icon className="w-3 h-3" />
      {up ? '+' : ''}
      {String(diff).replace('.', ',')}
      {unit}
      {label ? ` ${label}` : ''}
    </span>
  );
};

/** Barra de proporção com legenda (ex.: 7 de 10 = 70%). */
export const ProgressRow: React.FC<{
  label: React.ReactNode;
  value: number | null;
  detail?: React.ReactNode;
  tone?: 'ok' | 'bad' | 'accent' | 'gold';
  right?: React.ReactNode;
}> = ({ label, value, detail, tone = 'accent', right }) => {
  const bar = tone === 'ok' ? 'bg-[#7D9D7F]' : tone === 'bad' ? 'bg-[#C06C54]' : tone === 'gold' ? 'bg-[#B78A58]' : 'bg-[#8C7A6B]';
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2 text-xs">
        <span className="font-semibold text-[#2C2C2C] min-w-0 break-words leading-snug">{label}</span>
        <span className="shrink-0 flex items-center gap-1.5">
          {right}
          <span className={`font-extrabold ${value === null ? 'text-[#B4A597]' : 'text-[#2C2C2C]'}`}>{value === null ? '—' : `${value}%`}</span>
        </span>
      </div>
      <div className="w-full h-2 bg-[#EFE8DE] rounded-full overflow-hidden">
        {value !== null && <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />}
      </div>
      {detail && <p className="text-[10px] text-[#8C7A6B] leading-snug">{detail}</p>}
    </div>
  );
};

/** Barra dividida (positivo / negativo / outros) — só desenha se houver total. */
export const SplitBar: React.FC<{ parts: { value: number; tone: 'ok' | 'bad' | 'neutral' | 'gold'; label: string }[] }> = ({ parts }) => {
  const total = parts.reduce((n, p) => n + p.value, 0);
  if (!total) return null;
  const cls = { ok: 'bg-[#7D9D7F]', bad: 'bg-[#C06C54]', neutral: 'bg-[#DDD3C5]', gold: 'bg-[#B78A58]' };
  return (
    <div className="space-y-1.5">
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-[#EFE8DE]">
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} className={cls[p.tone]} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label}: ${p.value}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1 text-[10px] text-[#5C4F44]">
            <span className={`w-2 h-2 rounded-full ${cls[p.tone]}`} />
            {p.label}: <strong>{p.value}</strong>
            <span className="text-[#8C7A6B]">({Math.round((p.value / total) * 100)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Colunas ao longo do tempo. `null` = sem registro naquele ponto (coluna vazia tracejada, não zero).
 * `max` padrão 100 (percentuais).
 */
export const BarSeries: React.FC<{
  values: (number | null)[];
  labels: string[];
  max?: number;
  tone?: 'ok' | 'bad' | 'accent' | 'gold';
  format?: (v: number) => string;
  emptyText?: string;
}> = ({ values, labels, max, tone = 'accent', format = (v) => `${v}%`, emptyText }) => {
  if (!values.some((v) => v !== null)) return <EmptyState hint={emptyText} />;
  const top = max ?? Math.max(100, ...values.map((v) => v || 0));
  const bar = tone === 'ok' ? 'bg-[#7D9D7F]' : tone === 'bad' ? 'bg-[#C06C54]' : tone === 'gold' ? 'bg-[#B78A58]' : 'bg-[#8C7A6B]';
  const many = values.length > 12;
  const step = values.length > 20 ? Math.ceil(values.length / 8) : 1;
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-[3px] h-28">
        {values.map((v, i) => (
          <div key={i} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center" title={`${labels[i]}: ${v === null ? 'sem registro' : format(v)}`}>
            {!many && v !== null && <span className="text-[9px] font-bold text-[#5C4F44] leading-none mb-0.5 whitespace-nowrap">{format(v)}</span>}
            {v === null ? (
              <div className="w-full h-1.5 rounded-sm border border-dashed border-[#DDD3C5]" />
            ) : (
              <div className={`w-full rounded-t-md ${bar}`} style={{ height: `${Math.max(3, (v / top) * 100)}%` }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 min-w-0 text-center text-[9px] text-[#8C7A6B] leading-tight overflow-hidden whitespace-nowrap">
            {i % step === 0 ? l : ''}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-[#A39385] flex items-center gap-1">
        <span className="inline-block w-3 h-1.5 rounded-sm border border-dashed border-[#DDD3C5]" /> sem registro
      </p>
    </div>
  );
};

/** Linha simples para medições (peso, pressão...) — usa só pontos registrados. */
export const LineSeries: React.FC<{ points: { label: string; value: number }[]; unit?: string }> = ({ points, unit = '' }) => {
  if (points.length < 2) {
    return <EmptyState text={points.length === 1 ? 'Só uma medição registrada' : 'Sem medições registradas'} hint="O gráfico aparece a partir de duas medições." />;
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const W = 300;
  const H = 110;
  const pad = 14;
  const xy = points.map((p, i) => [pad + (i * (W - pad * 2)) / (points.length - 1), H - pad - ((p.value - min) / span) * (H - pad * 2)] as const);
  const fmt = (v: number) => `${String(Math.round(v * 10) / 10).replace('.', ',')}${unit}`;
  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 overflow-visible">
        <polyline points={xy.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#7D9D7F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {xy.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#8C7A6B" />
            {(points.length <= 8 || i === 0 || i === points.length - 1) && (
              <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#5C4F44">
                {fmt(points[i].value)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-[#8C7A6B]">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
};
