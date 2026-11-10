import React, { useEffect, useMemo, useState } from 'react';
import { Eraser, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Configurações > Dados: revisão dos dados de exemplo que vinham nas primeiras versões.
 * Respostas, humores e históricos de exemplo já saem dos relatórios automaticamente;
 * cadastros de exemplo (rotinas, agenda, remédios...) só saem quando a pessoa confirma.
 */
export const DemoDataReview: React.FC<{ onDone?: (msg: string) => void }> = ({ onDone }) => {
  const { demoCandidates, demoRemovedCount, removeDemoItems, keepDemoItems, undoDemoCleanup, dataMaintenance } = useApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [confirmUndo, setConfirmUndo] = useState(false);

  // Pre-select the examples that were never changed (members of the family are never pre-selected)
  useEffect(() => {
    setChecked((prev) => {
      const next: Record<string, boolean> = {};
      demoCandidates.forEach((c) => {
        const k = `${c.field}:${c.id}`;
        next[k] = k in prev ? prev[k] : c.unchanged && c.field !== 'profiles';
      });
      return next;
    });
  }, [demoCandidates]);

  const groups = useMemo(() => {
    const g: Record<string, typeof demoCandidates> = {};
    demoCandidates.forEach((c) => (g[c.group] = g[c.group] || []).push(c));
    return Object.entries(g);
  }, [demoCandidates]);

  const selected = demoCandidates.filter((c) => checked[`${c.field}:${c.id}`]);
  const notSelected = demoCandidates.filter((c) => !checked[`${c.field}:${c.id}`]);

  if (!demoCandidates.length && !demoRemovedCount) return null;

  return (
    <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#B78A58] shrink-0">
          <Eraser className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#2C2C2C]">Dados de exemplo</h4>
          <p className="text-[11px] text-[#8C7A6B] mt-0.5 leading-snug">
            As primeiras versões do app vinham com exemplos. Os gráficos e relatórios usam só o que você registrou.
          </p>
        </div>
      </div>

      {demoRemovedCount > 0 && (
        <div className="bg-[#F7F2EA] border border-[#ECE3D5] rounded-xl p-2.5 text-[11px] text-[#5C4F44] space-y-1.5">
          <p>
            <strong>{demoRemovedCount}</strong> {demoRemovedCount === 1 ? 'registro de exemplo foi retirado' : 'registros de exemplo foram retirados'}
            {dataMaintenance.demoCleanupAt ? ` em ${new Date(dataMaintenance.demoCleanupAt).toLocaleDateString('pt-BR')}` : ''}
            {' '}(respostas, humores, fatores, históricos e avisos que você nunca registrou). Uma cópia ficou guardada.
          </p>
          {!confirmUndo ? (
            <button type="button" onClick={() => setConfirmUndo(true)} className="inline-flex items-center gap-1 font-bold text-[#8C7A6B] hover:text-[#5C4F44]">
              <RotateCcw className="w-3 h-3" /> Desfazer e trazer de volta
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span>Trazer os exemplos de volta?</span>
              <button
                type="button"
                onClick={() => {
                  undoDemoCleanup();
                  setConfirmUndo(false);
                  onDone?.('Exemplos restaurados');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#8C7A6B] text-white font-bold"
              >
                Sim, trazer
              </button>
              <button type="button" onClick={() => setConfirmUndo(false)} className="px-2.5 py-1 rounded-lg bg-[#F4EDE2] font-bold">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {demoCandidates.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-[#5C4F44] leading-snug">
            Estes cadastros vieram como exemplo e ainda estão no app. Marque os que <strong>não são seus</strong> e toque em remover.
            Os que você usa, deixe sem marcar e toque em “Os outros são meus”.
          </p>
          {groups.map(([group, items]) => (
            <div key={group} className="space-y-1">
              <p className="text-[11px] font-bold text-[#4A3E34]">{group}</p>
              {items.map((c) => {
                const k = `${c.field}:${c.id}`;
                return (
                  <label key={k} className="flex items-start gap-2 text-xs text-[#2C2C2C] bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl px-2.5 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checked[k]}
                      onChange={(e) => setChecked((p) => ({ ...p, [k]: e.target.checked }))}
                      className="mt-0.5 accent-[#8C7A6B] shrink-0"
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {c.label}
                      {!c.unchanged && <span className="block text-[10px] text-[#8C7A6B]">Você alterou este item: confira antes de remover</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => {
                removeDemoItems(selected.map(({ field, id }) => ({ field, id })));
                onDone?.(`✓ ${selected.length} ${selected.length === 1 ? 'exemplo removido' : 'exemplos removidos'}`);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#8C7A6B] text-white text-xs font-bold disabled:opacity-50"
            >
              <Eraser className="w-3.5 h-3.5" /> Remover marcados ({selected.length})
            </button>
            <button
              type="button"
              disabled={!notSelected.length}
              onClick={() => {
                keepDemoItems(notSelected.map(({ field, id }) => ({ field, id })));
                onDone?.('✓ Guardados como seus');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F4EDE2] text-[#5C4F44] text-xs font-bold disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Os outros são meus ({notSelected.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
