import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Calendar, Clock, Check, Trash2 } from 'lucide-react';

export const AgendaModal: React.FC = () => {
  const { isAgendaModalOpen, setIsAgendaModalOpen, agendaItems, addAgendaItem, toggleAgendaItem, deleteAgendaItem } = useApp();

  const [title, setTitle] = useState('');
  const [day, setDay] = useState('Terça-feira');
  const [time, setTime] = useState('17:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [icon, setIcon] = useState('⚽');
  const [isAdding, setIsAdding] = useState(false);

  if (!isAgendaModalOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAgendaItem({
      title: title.trim(),
      date: '2026-11-17',
      time,
      displayDay: day,
      isRecurring,
      recurrenceLabel: isRecurring ? 'Recorrente' : undefined,
      category: 'familia',
      icon
    });
    setTitle('');
    setIsAdding(false);
  };

  const icons = ['⚽', '🎂', '💅', '🩺', '📚', '🎒', '🛒', '🚗'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">Minha Agenda</h2>
              <p className="text-xs text-[#8C7A6B]">Compromissos e eventos familiares</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAgendaModalOpen(false);
              setIsAdding(false);
            }}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agenda List */}
        <div className="py-4 space-y-3">
          {agendaItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                item.completed
                  ? 'bg-[#F2ECE2] border-[#DDD3C5] opacity-70'
                  : 'bg-[#FAF8F5] border-[#EFE8DE]'
              }`}
            >
              <div
                onClick={() => toggleAgendaItem(item.id)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      item.completed ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#8C7A6B] flex items-center gap-1.5 mt-0.5">
                    <span>{item.displayDay}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.isRecurring && (
                  <span className="text-[10px] font-semibold text-[#6E5D4F] bg-[#EFE8DE] px-2.5 py-0.5 rounded-full">
                    {item.recurrenceLabel || 'Recorrente'}
                  </span>
                )}
                <button
                  onClick={() => deleteAgendaItem(item.id)}
                  className="w-7 h-7 rounded-lg hover:bg-[#EAE0D2] flex items-center justify-center text-[#A39284] hover:text-[#5C4F44]"
                  title="Excluir compromisso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Form or Button */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo compromisso</span>
          </button>
        ) : (
          <form onSubmit={handleAdd} className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C3C3C] mb-1">
                Título do compromisso
              </label>
              <input
                type="text"
                placeholder="Ex: Natação do Bryan, Consulta pediátrica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#3C3C3C] mb-1">
                  Dia da semana
                </label>
                <input
                  type="text"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3C3C3C] mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C]"
                />
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-[#3C3C3C] mb-1">
                Ícone representativo
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
                      icon === ic ? 'bg-[#8C7A6B] text-white' : 'bg-[#F4EDE2]'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-[#C4B6A6] text-[#8C7A6B] focus:ring-[#8C7A6B]"
              />
              <span className="text-xs font-medium text-[#4A3E34]">
                Compromisso recorrente semanal
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 bg-[#8C7A6B] hover:bg-[#786657] text-white rounded-xl text-xs font-bold"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 bg-[#F4EDE2] text-[#5C4F44] rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
