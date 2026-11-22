import React, { useMemo, useState } from 'react';
import { ChevronDown, Trophy, TriangleAlert } from 'lucide-react';
import { LifeArea, QuestionItem, QuestionResponse } from '../../types';
import { Bucket, ReportPeriod, answerSeries, countAnswers, delta } from '../../utils/reportStats';
import { BarSeries, DeltaBadge, EmptyState, ProgressRow } from './ReportCharts';

/**
 * Meu Mapa por área da vida: % e quantidade de respostas positivas (verde) e negativas (vermelho),
 * só com respostas válidas (Sim/Não). "Não se aplica", "Não lembro" e dias sem resposta ficam de fora.
 */
export const AreaReport: React.FC<{
  lifeAreas: LifeArea[];
  questions: QuestionItem[];
  responses: QuestionResponse[];
  period: ReportPeriod;
  buckets: Bucket[];
  today: string;
}> = ({ lifeAreas, questions, responses, period, buckets, today }) => {
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      lifeAreas
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((area) => {
          const qs = questions.filter((q) => q.areaId === area.id);
          const now = countAnswers(qs, responses, period.from, period.to, today);
          const prev = countAnswers(qs, responses, period.prevFrom, period.prevTo, today);
          return { area, qs, now, prev };
        }),
    [lifeAreas, questions, responses, period, today]
  );

  const withData = rows.filter((r) => r.now.validas > 0);
  const best = withData.slice().sort((a, b) => (b.now.pctPositivo ?? 0) - (a.now.pctPositivo ?? 0) || b.now.validas - a.now.validas)[0];
  const worst = withData.slice().sort((a, b) => (b.now.pctNegativo ?? 0) - (a.now.pctNegativo ?? 0) || b.now.validas - a.now.validas)[0];

  if (!lifeAreas.length) return <EmptyState text="Nenhuma área da vida cadastrada" />;

  return (
    <div className="space-y-3">
      {withData.length >= 2 && best && worst && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#EEF5EF] border border-[#B7D2B9] p-3 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B663F] inline-flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Mais positiva
            </p>
            <p className="text-sm font-bold text-[#2C5230] mt-1 leading-tight break-words">
              {best.area.icon} {best.area.name}
            </p>
            <p className="text-xs text-[#2C5230]">{best.now.pctPositivo}% positivo</p>
          </div>
          <div className="rounded-2xl bg-[#FDF2EE] border border-[#E8C2B8] p-3 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C3A24] inline-flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" /> Mais negativa
            </p>
            <p className="text-sm font-bold text-[#8C3A24] mt-1 leading-tight break-words">
              {worst.area.icon} {worst.area.name}
            </p>
            <p className="text-xs text-[#8C3A24]">{worst.now.pctNegativo}% negativo</p>
          </div>
        </div>
      )}

      {rows.map(({ area, qs, now, prev }) => {
        const isOpen = open === area.id;
        const series = isOpen ? answerSeries(qs, responses, buckets, today).map((c) => c.pctPositivo) : [];
        return (
          <div key={area.id} className="bg-white border border-[#EFE8DE] rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setOpen(isOpen ? null : area.id)} className="w-full text-left p-3.5 space-y-2.5" aria-expanded={isOpen}>
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none shrink-0">{area.icon || '📌'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#2C2C2C] leading-tight break-words">{area.name}</p>
                  <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                    {qs.length === 0 ? 'Sem perguntas nesta área' : now.validas ? `${now.validas} ${now.validas === 1 ? 'resposta considerada' : 'respostas consideradas'}` : 'Sem respostas válidas no período'}
                  </p>
                </div>
                {now.validas > 0 && <DeltaBadge d={delta(now.pctPositivo, prev.pctPositivo)} />}
                <ChevronDown className={`w-4 h-4 shrink-0 text-[#A39385] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>

              {now.validas > 0 ? (
                <>
                  <div className="flex w-full h-3.5 rounded-full overflow-hidden bg-[#EFE8DE]">
                    <div className="bg-[#5E8B62]" style={{ width: `${now.pctPositivo}%` }} />
                    <div className="bg-[#C06C54]" style={{ width: `${now.pctNegativo}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#EEF5EF] px-2.5 py-1.5">
                      <p className="text-lg font-extrabold text-[#2C5230] leading-none">{now.pctPositivo}%</p>
                      <p className="text-[10px] text-[#3B663F] mt-0.5">
                        positivo · {now.positivo} {now.positivo === 1 ? 'registro' : 'registros'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#FDF2EE] px-2.5 py-1.5">
                      <p className="text-lg font-extrabold text-[#8C3A24] leading-none">{now.pctNegativo}%</p>
                      <p className="text-[10px] text-[#8C3A24] mt-0.5">
                        negativo · {now.negativo} {now.negativo === 1 ? 'registro' : 'registros'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                qs.length > 0 && <div className="h-3.5 rounded-full border border-dashed border-[#DDD3C5]" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-[#EFE8DE] bg-[#FAF8F5] p-3.5 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#4A3E34]">Evolução · % positivo</p>
                  <BarSeries values={series} labels={buckets.map((b) => b.label)} tone="ok" />
                </div>
                {(now.naoSeAplica > 0 || now.naoLembro > 0 || now.semResposta > 0) && (
                  <p className="text-[10px] text-[#8C7A6B] leading-snug">
                    Fora da conta: {now.naoSeAplica} “não se aplica”, {now.naoLembro} “não lembro” e {now.semResposta} sem resposta.
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#4A3E34]">Perguntas desta área</p>
                  {qs.length === 0 ? (
                    <p className="text-[11px] text-[#8C7A6B]">Nenhuma pergunta.</p>
                  ) : (
                    qs.map((q) => {
                      const c = countAnswers([q], responses, period.from, period.to, today);
                      return (
                        <ProgressRow
                          key={q.id}
                          label={q.title}
                          value={c.pctPositivo}
                          tone="ok"
                          detail={c.validas ? `${c.positivo} positivas · ${c.negativo} negativas` : 'Sem respostas válidas'}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
