// Peças visuais comuns (padrão das fotos de referência): cabeçalho com ícone, pílulas,
// cartões suaves, ícones em círculo, chips de status e botões pêssego.
// As cores usam os tons do app, então acompanham qualquer paleta escolhida.
import React from 'react';
import { Check, ChevronRight, LucideIcon } from 'lucide-react';

export const SHADOW = 'shadow-[0_6px_22px_rgba(150,100,60,0.09)]';
export const SHADOW_SOFT = 'shadow-[0_3px_12px_rgba(150,100,60,0.08)]';

/** Título da tela: ícone de traço + título grande; ação redonda à direita. */
export const PageHeader: React.FC<{
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, right }) => (
  <header className="flex items-center gap-3 pt-3 pb-1">
    <Icon className="w-7 h-7 shrink-0 text-[#9E6C52]" strokeWidth={1.9} aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <h1 className="text-[22px] font-bold text-[#2C2C2C] leading-tight tracking-tight truncate">{title}</h1>
      {subtitle && <p className="text-xs text-[#8C7A6B] leading-snug mt-0.5">{subtitle}</p>}
    </div>
    {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
  </header>
);

/** Botão redondo do cabeçalho (sino, +, atualizar...). */
export const RoundButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'plain' | 'accent' }> = ({
  label,
  tone = 'plain',
  className = '',
  children,
  ...rest
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`w-11 h-11 rounded-full flex items-center justify-center transition active:scale-95 ${
      tone === 'accent' ? 'bg-[#E6C8A8] text-[#4A3E34]' : `bg-[#FAF8F5] text-[#9E6C52] ${SHADOW_SOFT}`
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);

/** Pílulas separadas (Hoje / Semana / Mês). Ativa em caramelo. */
export function PillTabs<T extends string>({
  options,
  value,
  onChange,
  className = ''
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`} role="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`flex-1 min-w-0 h-11 px-3 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              on
                ? `bg-gradient-to-b from-[#8C7A6B] to-[#786657] text-white ${SHADOW}`
                : `bg-[#FAF8F5] text-[#4A3E34] ${SHADOW_SOFT} hover:bg-[#F4EDE2]`
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Trilho único (Seg Ter Qua...), o selecionado vira uma pílula caramelo. */
export function SegmentTrack<T extends string | number>({
  options,
  value,
  onChange,
  marker
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  marker?: T;
}) {
  return (
    <div className={`flex items-center bg-[#FAF8F5] rounded-full p-1 ${SHADOW_SOFT}`} role="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={String(o.id)}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={`relative flex-1 min-w-0 h-9 rounded-full text-[13px] font-semibold transition ${
              on ? 'bg-gradient-to-b from-[#8C7A6B] to-[#786657] text-white shadow-sm' : 'text-[#4A3E34]'
            }`}
          >
            {o.label}
            {marker === o.id && !on && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#B78A58]" />}
          </button>
        );
      })}
    </div>
  );
}

/** Cartão grande e suave. */
export const SoftCard: React.FC<{ className?: string; children: React.ReactNode; as?: 'section' | 'div' }> = ({ className = '', children, as = 'section' }) => {
  const Tag = as;
  return <Tag className={`bg-[#FAF8F5] rounded-[26px] border border-[#EFE8DE]/70 ${SHADOW} ${className}`}>{children}</Tag>;
};

/** Título de seção dentro do cartão, com "Ver tudo >" opcional. */
export const SectionTitle: React.FC<{ title: React.ReactNode; icon?: React.ReactNode; action?: { label: string; onClick: () => void }; right?: React.ReactNode }> = ({
  title,
  icon,
  action,
  right
}) => (
  <div className="flex items-center gap-2.5 min-h-8">
    {icon && <span className="shrink-0 text-[#9E6C52]">{icon}</span>}
    <h2 className="flex-1 min-w-0 text-[17px] font-bold text-[#2C2C2C] leading-tight">{title}</h2>
    {right}
    {action && (
      <button type="button" onClick={action.onClick} className="shrink-0 inline-flex items-center gap-0.5 text-xs font-semibold text-[#B78A58] hover:underline">
        {action.label} <ChevronRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

/** Ícone/emoji num círculo claro, como nas fotos. */
export const IconBubble: React.FC<{ children: React.ReactNode; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ children, size = 'md', className = '' }) => {
  const s = size === 'lg' ? 'w-16 h-16 text-[34px]' : size === 'sm' ? 'w-10 h-10 text-xl' : 'w-14 h-14 text-[28px]';
  return <span className={`${s} shrink-0 rounded-full bg-white flex items-center justify-center leading-none ${SHADOW_SOFT} ${className}`}>{children}</span>;
};

/** Linha de lista: ícone, título, detalhe e algo à direita. */
export const ListRow: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
  dim?: boolean;
}> = ({ icon, title, subtitle, extra, right, onClick, highlight, dim }) => {
  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-semibold text-[#2C2C2C] leading-snug break-words">{title}</span>
        {subtitle && <span className="block text-[13px] text-[#8C7A6B] leading-snug mt-0.5">{subtitle}</span>}
        {extra && <span className="block mt-1.5">{extra}</span>}
      </span>
    </>
  );
  return (
    <div className={`flex items-center gap-3.5 px-3 py-3 rounded-[22px] ${highlight ? 'bg-[#F4EDE2]' : ''} ${dim ? 'opacity-55' : ''}`}>
      {onClick ? (
        <button type="button" onClick={onClick} className="min-w-0 flex-1 flex items-center gap-3.5">
          {body}
        </button>
      ) : (
        <div className="min-w-0 flex-1 flex items-center gap-3.5">{body}</div>
      )}
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
};

/** Chip de status: Pendente (pêssego), Concluída (verde), Em andamento, informativo. */
export const StatusChip: React.FC<{ tone: 'pending' | 'done' | 'progress' | 'info' | 'bad'; children: React.ReactNode; icon?: boolean }> = ({ tone, children, icon }) => {
  const cls =
    tone === 'done'
      ? 'bg-[#EEF5EF] text-[#2C5230]'
      : tone === 'bad'
        ? 'bg-[#FDF2EE] text-[#8C3A24]'
        : tone === 'info'
          ? 'bg-[#F4EDE2] text-[#5C4F44]'
          : 'bg-[#FEF9E7] text-[#8C6D1F]';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {icon && <Check className="w-3 h-3" strokeWidth={3} />}
      {children}
    </span>
  );
};

/** Círculo de marcar: vazio (pendente), verde (feito) ou caramelo. */
export const CheckCircle: React.FC<{ done: boolean; tone?: 'green' | 'caramel'; onClick?: () => void; label: string }> = ({ done, tone = 'green', onClick, label }) => {
  const filled = tone === 'caramel' ? 'bg-[#B78A58] border-[#B78A58]' : 'bg-[#7D9D7F] border-[#7D9D7F]';
  const inner = (
    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${done ? `${filled} text-white` : 'border-[#C4B6A6] bg-transparent'}`}>
      {done && <Check className="w-4 h-4" strokeWidth={3} />}
    </span>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={done} className="p-1.5 -m-1.5 rounded-full">
      {inner}
    </button>
  ) : (
    <span aria-label={label}>{inner}</span>
  );
};

/** Botão largo pêssego ("Ver rotina completa", "Adicionar Meta +"). */
export const PeachButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...rest }) => (
  <button
    type="button"
    className={`w-full h-12 rounded-full bg-[#E6C8A8] hover:brightness-[1.03] text-[#4A3E34] text-[15px] font-semibold inline-flex items-center justify-center gap-2 ${SHADOW_SOFT} active:scale-[0.99] transition ${className}`}
    {...rest}
  >
    {children}
  </button>
);

/** Barra de progresso com %. */
export const ProgressLine: React.FC<{ value: number; tone?: 'caramel' | 'green' }> = ({ value, tone = 'caramel' }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-2.5 rounded-full bg-[#F4EDE2] overflow-hidden">
      <div className={`h-full rounded-full ${tone === 'green' ? 'bg-[#7D9D7F]' : 'bg-[#B78A58]'}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
    <span className="w-11 shrink-0 text-right text-sm font-semibold text-[#2C2C2C] tabular-nums">{Math.round(value)}%</span>
  </div>
);

/** Área da página (largura, margens e espaço para a barra inferior). */
export const Page: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`w-full max-w-xl mx-auto px-4 sm:px-6 pb-32 space-y-4 ${className}`}>{children}</div>
);
