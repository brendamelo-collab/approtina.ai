import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Copy,
  Check,
  Bot,
  Info,
  ThumbsUp,
  ShieldAlert,
  LayoutGrid
} from 'lucide-react';
import { todayISO, shiftISODate } from '../../utils/dateUtils';
import {
  PeriodKind,
  ReportPeriod,
  agendaReport,
  bucketsFor,
  buildPeriod,
  countAnswers,
  delta,
  factorReport,
  goalReport,
  medicationReport,
  moodReport,
  questionReports,
  recurringReport,
  routineReport,
  shortDate,
  answerSeries,
  DoneCounts
} from '../../utils/reportStats';
import { BarSeries, Card, DeltaBadge, EmptyState, ProgressRow, SplitBar, Stat } from '../reports/ReportCharts';

type Section = 'geral' | 'mapa' | 'humor' | 'rotinas' | 'saude' | 'agenda' | 'metas' | 'revisao';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'geral', label: 'Visão geral' },
  { id: 'mapa', label: 'Meu Mapa' },
  { id: 'humor', label: 'Humor e fatores' },
  { id: 'rotinas', label: 'Rotinas' },
  { id: 'saude', label: 'Saúde' },
  { id: 'agenda', label: 'Agenda e tarefas' },
  { id: 'metas', label: 'Metas' },
  { id: 'revisao', label: 'Resumo' }
];

const PERIODS: { id: PeriodKind; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'ano', label: 'Ano' },
  { id: 'personalizado', label: 'Período' }
];

const PERIOD_NAMES: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', especiais: 'Especiais' };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const fmtDate = (iso: string) => `${shortDate(iso)}/${iso.slice(0, 4)}`;

/** Recorta o período para começar no primeiro dia com dados (antes disso não existe "sem resposta"). */
const clip = (p: ReportPeriod, since: string | null): ReportPeriod => {
  if (!since) return p;
  return { ...p, from: p.from < since ? since : p.from, prevFrom: p.prevFrom < since ? since : p.prevFrom };
};

/** Legenda padrão dos itens com histórico diário (rotinas, remédios). */
const DoneSplit: React.FC<{ c: DoneCounts }> = ({ c }) => (
  <SplitBar
    parts={[
      { value: c.feitas, tone: 'ok', label: 'Feito' },
      { value: c.adiadas, tone: 'gold', label: 'Adiado' },
      { value: c.naoFeitas, tone: 'bad', label: 'Não feito' },
      { value: c.vistas + c.semRegistro, tone: 'neutral', label: 'Sem confirmação' }
    ]}
  />
);

export const RelatoriosView: React.FC = () => {
  const {
    setActiveTab,
    questions,
    questionResponses,
    lifeAreas,
    routineTasks,
    dailyChronologicalSteps,
    agendaItems,
    healthItems,
    healthNoteItems,
    goals,
    dayFactors,
    availableFactors,
    moodOptions,
    moodRecords,
    recurringTasks,
    recurringHistory,
    activityLog,
    demoCandidates,
    setIsAiChatOpen
  } = useApp();

  const today = todayISO();
  const [section, setSection] = useState<Section>('geral');
  const [kind, setKind] = useState<PeriodKind>('mes');
  const [anchor, setAnchor] = useState(today);
  const [custom, setCustom] = useState({ from: shiftISODate(today, -29), to: today });
  const [areaFilter, setAreaFilter] = useState('todas');
  const [habitView, setHabitView] = useState<'todos' | 'bons' | 'ruins'>('todos');
  const [copied, setCopied] = useState(false);

  const period = useMemo(() => buildPeriod(kind, anchor, custom), [kind, anchor, custom]);
  // Pontos do gráfico só até hoje (dias futuros não viram "sem registro")
  const buckets = useMemo(() => bucketsFor(period.from, period.to, period.granularity).filter((b) => b.from <= today), [period, today]);

  const move = (dir: -1 | 1) => {
    if (kind === 'dia') setAnchor(shiftISODate(anchor, dir));
    else if (kind === 'semana') setAnchor(shiftISODate(anchor, 7 * dir));
    else if (kind === 'mes') {
      const [y, m] = anchor.split('-').map(Number);
      const d = new Date(y, m - 1 + dir, 1);
      setAnchor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    } else if (kind === 'ano') setAnchor(`${Number(anchor.slice(0, 4)) + dir}-01-01`);
  };
  const atPresent = period.to >= today;

  // ---------------- MEU MAPA ----------------
  const mapQuestions = useMemo(
    () => (areaFilter === 'todas' ? questions : questions.filter((q) => q.areaId === areaFilter)),
    [questions, areaFilter]
  );
  const mapSince = useMemo(() => questionResponses.reduce<string | null>((m, r) => (!m || r.date < m ? r.date : m), null), [questionResponses]);
  const mapPeriod = clip(period, mapSince);
  const qReports = useMemo(
    () => questionReports(mapQuestions, questionResponses, mapPeriod, buckets, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapQuestions, questionResponses, mapPeriod.from, mapPeriod.to, mapPeriod.prevFrom, mapPeriod.prevTo, buckets, today]
  );
  const goodQs = mapQuestions.filter((q) => qReports.find((r) => r.question.id === q.id)?.good);
  const badQs = mapQuestions.filter((q) => !qReports.find((r) => r.question.id === q.id)?.good);
  const mapAll = countAnswers(mapQuestions, questionResponses, mapPeriod.from, mapPeriod.to, today);
  const mapPrev = countAnswers(mapQuestions, questionResponses, mapPeriod.prevFrom, mapPeriod.prevTo, today);
  const mapGood = countAnswers(goodQs, questionResponses, mapPeriod.from, mapPeriod.to, today);
  const mapGoodPrev = countAnswers(goodQs, questionResponses, mapPeriod.prevFrom, mapPeriod.prevTo, today);
  const mapBad = countAnswers(badQs, questionResponses, mapPeriod.from, mapPeriod.to, today);
  const mapBadPrev = countAnswers(badQs, questionResponses, mapPeriod.prevFrom, mapPeriod.prevTo, today);
  const viewQs = habitView === 'bons' ? goodQs : habitView === 'ruins' ? badQs : mapQuestions;
  const mapSeries = answerSeries(viewQs, questionResponses, buckets, today);

  // ---------------- OUTROS MÓDULOS ----------------
  const mood = useMemo(() => moodReport(moodRecords, moodOptions, period, buckets), [moodRecords, moodOptions, period, buckets]);
  const factors = useMemo(() => factorReport(dayFactors, availableFactors, period), [dayFactors, availableFactors, period]);
  const routines = useMemo(
    () => routineReport(routineTasks, dailyChronologicalSteps, activityLog, period, buckets, today),
    [routineTasks, dailyChronologicalSteps, activityLog, period, buckets, today]
  );
  const meds = useMemo(() => medicationReport(healthItems, activityLog, period, buckets, today), [healthItems, activityLog, period, buckets, today]);
  const agenda = useMemo(() => agendaReport(agendaItems, activityLog, period, today), [agendaItems, activityLog, period, today]);
  const recurring = useMemo(() => recurringReport(recurringTasks, recurringHistory, period, buckets), [recurringTasks, recurringHistory, period, buckets]);
  const goalsR = useMemo(() => goalReport(goals), [goals]);

  const logSince = activityLog.since;
  const beforeLog = !!logSince && period.to < logSince;
  const logNote = logSince ? (
    <p className="text-[10px] text-[#8C7A6B] leading-snug flex gap-1">
      <Info className="w-3 h-3 shrink-0 mt-px" />
      <span>
        O histórico diário de rotinas, remédios e agenda começou em {fmtDate(logSince)}. Dias anteriores não entram na conta (não viram “não feito”).
      </span>
    </p>
  ) : null;

  // ---------------- TEXTO DO RESUMO ----------------
  const pctTxt = (v: number | null) => (v === null ? 'sem dados' : `${v}%`);
  const summaryLines = [
    `Rotina.ai · Resumo de ${period.label}`,
    '',
    `Meu Mapa: ${mapAll.validas ? `${mapAll.pctPositivo}% positivo (${mapAll.positivo} de ${mapAll.validas} respostas válidas)` : 'sem respostas no período'}.`,
    goodQs.length ? `  Hábitos positivos cumpridos: ${pctTxt(mapGood.pctPositivo)} (${mapGood.positivo} de ${mapGood.validas}).` : '',
    badQs.length ? `  Comportamentos a evitar: aconteceram ${plural(mapBad.negativo, 'vez', 'vezes')}; evitados em ${pctTxt(mapBad.pctPositivo)} das respostas.` : '',
    `Rotinas: ${routines.total.previstas ? `${routines.total.feitas} de ${routines.total.previstas} feitas (${pctTxt(routines.total.pct)}), ${routines.total.adiadas} adiadas` : 'sem registros no período'}.`,
    `Remédios e suplementos: ${meds.total.previstas ? `${meds.total.feitas} de ${meds.total.previstas} doses confirmadas (${pctTxt(meds.total.pct)})` : 'sem registros no período'}.`,
    `Agenda: ${agenda.previstos ? `${agenda.realizados} de ${agenda.previstos} compromissos marcados como feitos (${pctTxt(agenda.pct)})` : 'sem compromissos no período'}.`,
    `Tarefas recorrentes: ${plural(recurring.total, 'execução registrada', 'execuções registradas')}.`,
    `Humor: ${mood.total ? `${plural(mood.total, 'registro', 'registros')} em ${plural(mood.daysWithMood, 'dia', 'dias')}${mood.byMood[0] ? `; mais frequente: ${mood.byMood[0].option.label}` : ''}` : 'sem registros no período'}.`,
    factors.rows.length ? `Fatores mais marcados: ${factors.rows.slice(0, 3).map((f) => `${f.factor.label} (${plural(f.days, 'dia', 'dias')})`).join(', ')}.` : '',
    `Metas: ${goalsR.total ? `${goalsR.concluidas} concluída(s), ${goalsR.emAndamento} em andamento` : 'nenhuma meta cadastrada'}.`
  ].filter((l) => l !== '');

  const copySummary = () => {
    try {
      navigator.clipboard.writeText(summaryLines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // sem acesso à área de transferência
    }
  };

  // ---------------- PEÇAS ----------------
  const periodPicker = (
    <div className="bg-white border border-[#EFE8DE] rounded-3xl p-3 space-y-2.5">
      <div className="grid grid-cols-5 gap-1 bg-[#F4EDE2] p-1 rounded-2xl">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setKind(p.id)}
            className={`py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
              kind === p.id ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs' : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {kind === 'personalizado' ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-bold text-[#5C4F44] space-y-1">
            <span>De</span>
            <input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
              className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl px-2 py-1.5 text-xs text-[#2C2C2C]"
            />
          </label>
          <label className="text-[11px] font-bold text-[#5C4F44] space-y-1">
            <span>Até</span>
            <input
              type="date"
              value={custom.to}
              min={custom.from}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))}
              className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl px-2 py-1.5 text-xs text-[#2C2C2C]"
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]" aria-label="Período anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-bold text-[#2C2C2C] leading-tight truncate">{period.label.charAt(0).toUpperCase() + period.label.slice(1)}</p>
            <p className="text-[10px] text-[#8C7A6B] leading-tight">comparado com {period.prevLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={atPresent}
            className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44] disabled:opacity-40"
            aria-label="Próximo período"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {kind === 'personalizado' && <p className="text-[10px] text-[#8C7A6B] text-center">{period.label} · comparado com os {period.prevLabel}</p>}
    </div>
  );

  const sectionTabs = (
    <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
      <div className="flex gap-1.5 w-max pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
              section === s.id ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#5C4F44]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  const mapGeneralCard = (
    <Card
      title="Respostas do período"
      subtitle="“Não se aplica”, “Não lembro” e dias sem resposta não entram na porcentagem."
      right={<DeltaBadge d={delta(mapAll.pctPositivo, mapPrev.pctPositivo)} />}
    >
      {mapAll.validas + mapAll.naoSeAplica + mapAll.naoLembro === 0 ? (
        <EmptyState hint={questions.length ? 'Responda às perguntas do Meu Mapa para ver os números.' : 'Crie perguntas no Meu Mapa para acompanhar hábitos.'} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Positivo" value={mapAll.pctPositivo} suffix="%" tone="ok" note={`${mapAll.positivo} de ${mapAll.validas} válidas`} />
            <Stat label="Negativo" value={mapAll.pctNegativo} suffix="%" tone="bad" note={`${mapAll.negativo} de ${mapAll.validas} válidas`} />
          </div>
          <SplitBar
            parts={[
              { value: mapAll.positivo, tone: 'ok', label: 'Positivo' },
              { value: mapAll.negativo, tone: 'bad', label: 'Negativo' },
              { value: mapAll.naoSeAplica + mapAll.naoLembro, tone: 'neutral', label: 'Não se aplica / não lembro' }
            ]}
          />
          {mapAll.semResposta > 0 && (
            <p className="text-[10px] text-[#8C7A6B]">
              {plural(mapAll.semResposta, 'pergunta prevista ficou', 'perguntas previstas ficaram')} sem resposta (não contam como negativas).
            </p>
          )}
        </>
      )}
    </Card>
  );

  // ---------------- RENDER ----------------
  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none space-y-3.5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={() => setActiveTab('inicio')}
          className="w-9 h-9 shrink-0 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          aria-label="Voltar ao início"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[#2C2C2C] leading-tight flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#8C7A6B] shrink-0" /> Relatórios
          </h1>
          <p className="text-[11px] text-[#8C7A6B] leading-snug">Calculados só com o que você registrou</p>
        </div>
      </div>

      {demoCandidates.length > 0 && (
        <button
          type="button"
          onClick={() => setActiveTab('configuracoes')}
          className="w-full text-left bg-[#FEF9E7] border border-[#EADB9B] rounded-2xl p-3 text-[11px] text-[#5A4510] leading-snug"
        >
          Existem cadastros de exemplo das primeiras versões do app. Revise em <strong>Configurações › Dados de exemplo</strong> para tirar o que não é seu.
        </button>
      )}

      {periodPicker}
      {sectionTabs}

      {/* ====================== VISÃO GERAL ====================== */}
      {section === 'geral' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSection('mapa')} className="text-left">
              <Stat
                label="Meu Mapa · positivo"
                value={mapAll.pctPositivo}
                suffix="%"
                tone="ok"
                note={<DeltaBadge d={delta(mapAll.pctPositivo, mapPrev.pctPositivo)} />}
              />
            </button>
            <button type="button" onClick={() => setSection('rotinas')} className="text-left">
              <Stat
                label="Rotinas feitas"
                value={routines.total.pct}
                suffix="%"
                note={<DeltaBadge d={delta(routines.total.pct, routines.previousTotal.pct)} />}
              />
            </button>
            <button type="button" onClick={() => setSection('saude')} className="text-left">
              <Stat label="Remédios tomados" value={meds.total.pct} suffix="%" note={<DeltaBadge d={delta(meds.total.pct, meds.previousTotal.pct)} />} />
            </button>
            <button type="button" onClick={() => setSection('agenda')} className="text-left">
              <Stat
                label="Agenda cumprida"
                value={agenda.pct}
                suffix="%"
                note={agenda.previstos ? `${agenda.realizados} de ${agenda.previstos}` : 'sem compromissos'}
              />
            </button>
            <button type="button" onClick={() => setSection('humor')} className="text-left">
              <Stat
                label="Registros de humor"
                value={mood.total || null}
                note={mood.byMood[0] ? `mais frequente: ${mood.byMood[0].option.emoji} ${mood.byMood[0].option.label}` : 'nenhum no período'}
              />
            </button>
            <button type="button" onClick={() => setSection('metas')} className="text-left">
              <Stat label="Metas concluídas" value={goalsR.total ? goalsR.concluidas : null} note={goalsR.total ? `de ${goalsR.total} metas` : 'nenhuma meta'} />
            </button>
          </div>

          {mapGeneralCard}

          <Card title="Evolução do Meu Mapa" subtitle={`% de respostas positivas por ${period.granularity === 'dia' ? 'dia' : period.granularity === 'semana' ? 'semana' : 'mês'}`}>
            <BarSeries values={mapSeries.map((c) => c.pctPositivo)} labels={buckets.map((b) => b.label)} tone="ok" />
          </Card>

          <Card title="Rotinas e remédios" subtitle="Feito, adiado, não feito ou sem confirmação">
            {routines.total.previstas + meds.total.previstas === 0 ? (
              <EmptyState hint={beforeLog ? 'Este período é anterior ao início do histórico diário.' : 'Marque rotinas e remédios como feitos para ver aqui.'} />
            ) : (
              <div className="space-y-3">
                {routines.total.previstas > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-[#4A3E34]">
                      Rotinas · {routines.total.feitas} de {routines.total.previstas}
                    </p>
                    <DoneSplit c={routines.total} />
                  </div>
                )}
                {meds.total.previstas > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-[#4A3E34]">
                      Remédios · {meds.total.feitas} de {meds.total.previstas}
                    </p>
                    <DoneSplit c={meds.total} />
                  </div>
                )}
              </div>
            )}
            {logNote}
          </Card>
        </div>
      )}

      {/* ====================== MEU MAPA ====================== */}
      {section === 'mapa' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full bg-white border border-[#EFE8DE] rounded-2xl px-3 py-2 text-xs font-bold text-[#2C2C2C]"
              aria-label="Área da vida"
            >
              <option value="todas">Todas as áreas</option>
              {lifeAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon ? `${a.icon} ` : ''}
                  {a.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-1 bg-[#F4EDE2] p-1 rounded-2xl">
              {[
                { id: 'todos' as const, label: 'Geral', Icon: LayoutGrid },
                { id: 'bons' as const, label: 'Positivos', Icon: ThumbsUp },
                { id: 'ruins' as const, label: 'A evitar', Icon: ShieldAlert }
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setHabitView(id)}
                  className={`py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 ${
                    habitView === id ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs' : 'text-[#8C7A6B]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                </button>
              ))}
            </div>
          </div>

          {habitView === 'todos' && mapGeneralCard}

          {(habitView === 'todos' || habitView === 'bons') && (
            <Card
              title={
                <span className="inline-flex items-center gap-1.5 text-[#2C5230]">
                  <ThumbsUp className="w-4 h-4" /> Hábitos positivos
                </span>
              }
              subtitle="Quantas vezes você cumpriu o que quer manter"
              right={<DeltaBadge d={delta(mapGood.pctPositivo, mapGoodPrev.pctPositivo)} />}
            >
              {goodQs.length === 0 ? (
                <EmptyState text="Nenhum hábito positivo cadastrado" />
              ) : mapGood.validas === 0 ? (
                <EmptyState hint="Sem respostas válidas para os hábitos positivos neste período." />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Cumprido" value={mapGood.positivo} tone="ok" note={`de ${mapGood.validas}`} />
                  <Stat label="Não cumprido" value={mapGood.negativo} tone="bad" />
                  <Stat label="Cumprimento" value={mapGood.pctPositivo} suffix="%" tone="ok" />
                </div>
              )}
            </Card>
          )}

          {(habitView === 'todos' || habitView === 'ruins') && (
            <Card
              title={
                <span className="inline-flex items-center gap-1.5 text-[#8C3A24]">
                  <ShieldAlert className="w-4 h-4" /> Comportamentos a evitar
                </span>
              }
              subtitle="Quantas vezes aconteceram e quantas você evitou"
              right={<DeltaBadge d={delta(mapBad.negativo, mapBadPrev.negativo)} unit="" higherIsBetter={false} label="vezes" />}
            >
              {badQs.length === 0 ? (
                <EmptyState text="Nenhum comportamento a evitar cadastrado" />
              ) : mapBad.validas === 0 ? (
                <EmptyState hint="Sem respostas válidas para os comportamentos a evitar neste período." />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Aconteceu" value={mapBad.negativo} tone="bad" note={`de ${mapBad.validas}`} />
                  <Stat label="Evitou" value={mapBad.positivo} tone="ok" />
                  <Stat label="Evitado" value={mapBad.pctPositivo} suffix="%" tone="ok" />
                </div>
              )}
            </Card>
          )}

          <Card title="Evolução" subtitle={`% positivo · ${habitView === 'bons' ? 'hábitos positivos' : habitView === 'ruins' ? 'comportamentos evitados' : 'todas as perguntas'}`}>
            <BarSeries values={mapSeries.map((c) => c.pctPositivo)} labels={buckets.map((b) => b.label)} tone={habitView === 'ruins' ? 'gold' : 'ok'} />
          </Card>

          {areaFilter === 'todas' && habitView === 'todos' && lifeAreas.length > 0 && (
            <Card title="Por área da vida">
              {lifeAreas.map((a) => {
                const qs = questions.filter((q) => q.areaId === a.id);
                const c = countAnswers(qs, questionResponses, mapPeriod.from, mapPeriod.to, today);
                const p = countAnswers(qs, questionResponses, mapPeriod.prevFrom, mapPeriod.prevTo, today);
                return (
                  <ProgressRow
                    key={a.id}
                    label={`${a.icon ? `${a.icon} ` : ''}${a.name}`}
                    value={c.pctPositivo}
                    tone="ok"
                    right={c.validas ? <DeltaBadge d={delta(c.pctPositivo, p.pctPositivo)} /> : undefined}
                    detail={qs.length === 0 ? 'Sem perguntas nesta área' : c.validas ? `${c.positivo} positivas de ${c.validas} válidas` : 'Sem respostas válidas'}
                  />
                );
              })}
            </Card>
          )}

          <Card title="Pergunta por pergunta" subtitle="Ordenado do maior para o menor cumprimento">
            {qReports.filter((r) => (habitView === 'bons' ? r.good : habitView === 'ruins' ? !r.good : true)).length === 0 ? (
              <EmptyState text="Nenhuma pergunta neste filtro" />
            ) : (
              qReports
                .filter((r) => (habitView === 'bons' ? r.good : habitView === 'ruins' ? !r.good : true))
                .sort((a, b) => (b.counts.pctPositivo ?? -1) - (a.counts.pctPositivo ?? -1))
                .map((r) => (
                  <ProgressRow
                    key={r.question.id}
                    label={r.question.title}
                    value={r.counts.pctPositivo}
                    tone={r.good ? 'ok' : 'gold'}
                    right={r.counts.validas ? <DeltaBadge d={delta(r.counts.pctPositivo, r.previous.pctPositivo)} /> : undefined}
                    detail={
                      r.counts.validas === 0
                        ? `Sem respostas válidas${r.counts.semResposta ? ` · ${r.counts.semResposta} sem resposta` : ''}`
                        : r.good
                          ? `Cumpriu ${plural(r.counts.positivo, 'vez', 'vezes')} de ${r.counts.validas} · antes: ${r.previousOccurrences}`
                          : `Aconteceu ${plural(r.counts.negativo, 'vez', 'vezes')} · evitou ${r.counts.positivo} · antes aconteceu ${r.previousOccurrences}`
                    }
                  />
                ))
            )}
          </Card>
        </div>
      )}

      {/* ====================== HUMOR E FATORES ====================== */}
      {section === 'humor' && (
        <div className="space-y-3">
          <Card
            title="Como você se sentiu"
            subtitle={mood.total ? `${plural(mood.total, 'registro', 'registros')} em ${plural(mood.daysWithMood, 'dia', 'dias')} de ${period.days}` : undefined}
            right={mood.total ? <DeltaBadge d={delta(mood.average, mood.previousAverage)} unit="" label="na média" /> : undefined}
          >
            {mood.total === 0 ? (
              <EmptyState hint="Registre seu humor na tela inicial para ver a distribuição." />
            ) : (
              mood.byMood.map((m) => (
                <ProgressRow key={m.option.id} label={`${m.option.emoji} ${m.option.label}`} value={m.pct} detail={plural(m.count, 'registro', 'registros')} />
              ))
            )}
          </Card>

          <Card title="Evolução do humor" subtitle="Média de 1 (mais difícil) a 5 (muito bem)">
            <BarSeries
              values={mood.series}
              labels={buckets.map((b) => b.label)}
              max={5}
              tone="gold"
              format={(v) => String(v).replace('.', ',')}
            />
          </Card>

          <Card title="Fatores do dia" subtitle={factors.daysMarked ? `Marcados em ${plural(factors.daysMarked, 'dia', 'dias')}` : undefined}>
            {factors.rows.length === 0 ? (
              <EmptyState hint="Marque os fatores do dia no Meu Mapa para ver o que mais apareceu." />
            ) : (
              factors.rows.map((f) => (
                <ProgressRow
                  key={f.factor.id}
                  label={`${f.factor.icon ? `${f.factor.icon} ` : ''}${f.factor.label}`}
                  value={f.pctDays}
                  tone="gold"
                  right={<DeltaBadge d={delta(f.days, f.previousDays)} unit="" higherIsBetter label="dias" />}
                  detail={`${plural(f.days, 'dia', 'dias')} neste período · ${plural(f.previousDays, 'dia', 'dias')} no anterior`}
                />
              ))
            )}
          </Card>
        </div>
      )}

      {/* ====================== ROTINAS ====================== */}
      {section === 'rotinas' && (
        <div className="space-y-3">
          <Card title="Cumprimento das rotinas" right={<DeltaBadge d={delta(routines.total.pct, routines.previousTotal.pct)} />}>
            {routines.total.previstas === 0 ? (
              <EmptyState hint={beforeLog ? 'Este período é anterior ao início do histórico diário.' : 'Sem rotinas previstas com histórico neste período.'} />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Previstas" value={routines.total.previstas} />
                  <Stat label="Feitas" value={routines.total.feitas} tone="ok" />
                  <Stat label="Cumprimento" value={routines.total.pct} suffix="%" tone="ok" />
                </div>
                <DoneSplit c={routines.total} />
              </>
            )}
            {logNote}
          </Card>

          <Card title="Evolução" subtitle="% de rotinas feitas">
            <BarSeries values={routines.routines.series} labels={buckets.map((b) => b.label)} tone="ok" />
          </Card>

          <Card title="Por período do dia">
            {routines.byPeriod.every((p) => p.counts.previstas === 0) ? (
              <EmptyState />
            ) : (
              routines.byPeriod
                .filter((p) => p.counts.previstas > 0)
                .map((p) => (
                  <ProgressRow
                    key={p.period}
                    label={PERIOD_NAMES[p.period]}
                    value={p.counts.pct}
                    tone="ok"
                    detail={`${p.counts.feitas} de ${p.counts.previstas} · ${p.counts.adiadas} adiadas`}
                  />
                ))
            )}
          </Card>

          <Card title="Cada rotina">
            {routines.routines.rows.filter((r) => r.counts.previstas > 0).length === 0 ? (
              <EmptyState />
            ) : (
              routines.routines.rows
                .filter((r) => r.counts.previstas > 0)
                .sort((a, b) => (b.counts.pct ?? -1) - (a.counts.pct ?? -1))
                .map((r) => (
                  <ProgressRow
                    key={r.item.id}
                    label={r.item.title}
                    value={r.counts.pct}
                    tone="ok"
                    right={<DeltaBadge d={delta(r.counts.pct, r.previous.pct)} />}
                    detail={`Feita ${r.counts.feitas} de ${r.counts.previstas} · adiada ${r.counts.adiadas} · não feita ${r.counts.naoFeitas} · sem confirmação ${r.counts.vistas + r.counts.semRegistro}`}
                  />
                ))
            )}
          </Card>

          {routines.chrono.total.previstas > 0 && (
            <Card title="Rotina diária (horários)">
              {routines.chrono.rows.map((r) => (
                <ProgressRow
                  key={r.item.id}
                  label={`${r.item.time ? `${r.item.time} · ` : ''}${r.item.title}`}
                  value={r.counts.pct}
                  tone="ok"
                  detail={`${r.counts.feitas} de ${r.counts.previstas} dias`}
                />
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ====================== SAÚDE ====================== */}
      {section === 'saude' && (
        <div className="space-y-3">
          <Card title="Remédios e suplementos" right={<DeltaBadge d={delta(meds.total.pct, meds.previousTotal.pct)} />}>
            {healthItems.length === 0 ? (
              <EmptyState text="Nenhum remédio cadastrado" />
            ) : meds.total.previstas === 0 ? (
              <EmptyState hint={beforeLog ? 'Este período é anterior ao início do histórico diário.' : 'Sem doses com histórico neste período.'} />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Doses previstas" value={meds.total.previstas} />
                  <Stat label="Tomadas" value={meds.total.feitas} tone="ok" />
                  <Stat label="Adesão" value={meds.total.pct} suffix="%" tone="ok" />
                </div>
                <DoneSplit c={meds.total} />
              </>
            )}
            {logNote}
          </Card>

          <Card title="Evolução" subtitle="% de doses confirmadas">
            <BarSeries values={meds.series} labels={buckets.map((b) => b.label)} tone="ok" />
          </Card>

          {Object.keys(meds.byMember).length > 1 && (
            <Card title="Por pessoa">
              {Object.entries(meds.byMember).map(([name, c]) => (
                <ProgressRow key={name} label={name} value={c.pct} tone="ok" detail={`${c.feitas} de ${c.previstas} doses`} />
              ))}
            </Card>
          )}

          {meds.rows.some((r) => r.counts.previstas > 0) && (
            <Card title="Cada remédio">
              {meds.rows
                .filter((r) => r.counts.previstas > 0)
                .map((r) => (
                  <ProgressRow
                    key={r.item.id}
                    label={`${r.item.name}${r.item.memberName ? ` · ${r.item.memberName}` : ''}`}
                    value={r.counts.pct}
                    tone="ok"
                    right={<DeltaBadge d={delta(r.counts.pct, r.previous.pct)} />}
                    detail={`Tomado ${r.counts.feitas} de ${r.counts.previstas} · adiado ${r.counts.adiadas} · sem confirmação ${r.counts.vistas + r.counts.semRegistro}`}
                  />
                ))}
            </Card>
          )}

          <Card title="Medições e anotações">
            {(() => {
              const withMetrics = healthNoteItems.filter((n) => n.metrics && n.metrics.length > 0);
              if (!withMetrics.length) return <EmptyState text="Sem medições registradas" hint="Anotações com medidas aparecem em Saúde › Anotações › Evolução." />;
              return (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#5C4F44]">{plural(withMetrics.length, 'anotação com medida', 'anotações com medidas')}.</p>
                  <button type="button" onClick={() => setActiveTab('saude')} className="shrink-0 text-[11px] font-bold text-white bg-[#8C7A6B] px-3 py-1.5 rounded-xl">
                    Ver evolução
                  </button>
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {/* ====================== AGENDA E TAREFAS ====================== */}
      {section === 'agenda' && (
        <div className="space-y-3">
          <Card title="Compromissos da agenda" subtitle="Só contam os dias até hoje">
            {agenda.previstos === 0 ? (
              <EmptyState hint={agenda.futuros ? `${plural(agenda.futuros, 'compromisso ainda vai acontecer', 'compromissos ainda vão acontecer')} neste período.` : 'Sem compromissos neste período.'} />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Previstos" value={agenda.previstos} />
                  <Stat label="Feitos" value={agenda.realizados} tone="ok" />
                  <Stat label="Cumprido" value={agenda.pct} suffix="%" tone="ok" />
                </div>
                <p className="text-[10px] text-[#8C7A6B]">
                  {plural(agenda.semRegistro, 'compromisso sem marcação', 'compromissos sem marcação')} (não contam como faltas)
                  {agenda.futuros ? ` · ${agenda.futuros} ainda por vir` : ''}.
                </p>
              </>
            )}
          </Card>

          <Card title="Tarefas recorrentes" right={<DeltaBadge d={delta(recurring.total, recurring.previousTotal)} unit="" label="execuções" />}>
            {recurringTasks.length === 0 ? (
              <EmptyState text="Nenhuma tarefa recorrente cadastrada" />
            ) : recurring.total === 0 && recurring.previousTotal === 0 ? (
              <EmptyState hint="Nenhuma execução registrada neste período." />
            ) : (
              <>
                <BarSeries values={recurring.series.map((v) => v)} labels={buckets.map((b) => b.label)} max={Math.max(1, ...recurring.series)} format={(v) => String(v)} />
                <div className="space-y-1.5">
                  {recurring.rows
                    .filter((r) => r.count > 0 || r.previous > 0)
                    .map((r) => (
                      <div key={r.task.id} className="flex items-start justify-between gap-2 text-xs">
                        <span className="min-w-0 break-words text-[#2C2C2C] font-semibold">
                          {r.task.icon} {r.task.title}
                        </span>
                        <span className="shrink-0 text-[#5C4F44]">
                          <strong>{r.count}×</strong> <span className="text-[10px] text-[#8C7A6B]">(antes {r.previous}×)</span>
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ====================== METAS ====================== */}
      {section === 'metas' && (
        <div className="space-y-3">
          <Card title="Metas">
            {goalsR.total === 0 ? (
              <EmptyState text="Nenhuma meta cadastrada" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Concluídas" value={goalsR.concluidas} tone="ok" />
                  <Stat label="Em andamento" value={goalsR.emAndamento} />
                  <Stat label="Progresso médio" value={goalsR.mediaProgresso} suffix="%" />
                </div>
                {goalsR.active.map((g) => (
                  <ProgressRow
                    key={g.id}
                    label={g.title}
                    value={Math.round(g.progressPercent || 0)}
                    tone="gold"
                    detail={g.totalSteps ? `${g.completedSteps} de ${g.totalSteps} etapas${g.dueDate ? ` · prazo ${fmtDate(g.dueDate)}` : ''}` : g.dueDate ? `prazo ${fmtDate(g.dueDate)}` : undefined}
                  />
                ))}
                {goalsR.done.length > 0 && (
                  <p className="text-[11px] text-[#2C5230]">
                    Concluídas: {goalsR.done.map((g) => g.title).join(', ')}
                  </p>
                )}
              </>
            )}
            <p className="text-[10px] text-[#8C7A6B]">As metas mostram a situação atual (não dependem do período escolhido).</p>
          </Card>
        </div>
      )}

      {/* ====================== RESUMO ====================== */}
      {section === 'revisao' && (
        <Card title={`Resumo · ${period.label}`} subtitle="Retrato dos seus registros, sem julgamento e sem números de exemplo">
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3 space-y-1.5">
            {summaryLines.slice(2).map((l, i) => (
              <p key={i} className={`text-xs leading-snug break-words ${l.startsWith('  ') ? 'pl-3 text-[#5C4F44]' : 'text-[#2C2C2C]'}`}>
                {l.trim()}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={copySummary} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F4EDE2] text-[#5C4F44] text-xs font-bold">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar resumo'}
            </button>
            <button
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#8C7A6B] text-white text-xs font-bold"
            >
              <Bot className="w-3.5 h-3.5" /> Conversar com a IA
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};
