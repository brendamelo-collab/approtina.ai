import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check } from 'lucide-react';
import { MoodValue } from '../types';

export const MoodModal: React.FC = () => {
  const { isMoodModalOpen, setIsMoodModalOpen, currentMood, saveMoodEntry, selectedDate } = useApp();

  const [selectedMood, setSelectedMood] = useState<MoodValue>((currentMood?.value || currentMood?.mood || 'bem') as MoodValue);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(
    currentMood?.factors || ['Família', 'Tempo de qualidade']
  );
  const [notes, setNotes] = useState(currentMood?.notes || '');

  if (!isMoodModalOpen) return null;

  const moods: { value: MoodValue; label: string; emoji: string; score: number }[] = [
    { value: 'otimo', label: 'Ótimo', emoji: '😃', score: 95 },
    { value: 'bem', label: 'Bem', emoji: '😊', score: 78 },
    { value: 'neutro', label: 'Neutro', emoji: '😐', score: 50 },
    { value: 'triste', label: 'Triste', emoji: '😔', score: 30 },
    { value: 'ansiosa', label: 'Ansiosa', emoji: '🥺', score: 25 }
  ];

  const factorsList = [
    'Sono ruim',
    'Cansaço',
    'Sobrecarga',
    'Família',
    'Trabalho',
    'Outros',
    'Tempo a sós',
    'Alimentação'
  ];

  const toggleFactor = (factor: string) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter((f) => f !== factor));
    } else {
      if (selectedFactors.length < 3) {
        setSelectedFactors([...selectedFactors, factor]);
      }
    }
  };

  const handleSave = () => {
    saveMoodEntry(selectedMood, notes);
    setIsMoodModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div>
            <h2 className="text-base font-bold text-[#2C2C2C]">Registro Diário do Mapa</h2>
            <p className="text-xs text-[#8C7A6B]">Como está seu bem-estar hoje?</p>
          </div>
          <button
            onClick={() => setIsMoodModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mood Faces */}
        <div className="my-5">
          <label className="block text-xs font-bold text-[#3C3C3C] mb-3 text-center">
            Como você está hoje?
          </label>
          <div className="flex items-center justify-between gap-1.5">
            {moods.map((m) => {
              const isSelected = selectedMood === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setSelectedMood(m.value)}
                  className={`flex-1 py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#EAE0D2] ring-2 ring-[#8C7A6B] shadow-xs scale-105'
                      : 'bg-[#FAF8F5] border border-[#EFE8DE] hover:bg-[#F5ECE0]'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span
                    className={`text-[10px] mt-1.5 ${
                      isSelected ? 'font-bold text-[#2C2C2C]' : 'font-medium text-[#8C7A6B]'
                    }`}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Factors */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#3C3C3C]">
              Fatores que influenciaram seu dia
            </span>
            <span className="text-[10px] text-[#8C7A6B]">Até 3 opções</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {factorsList.map((f) => {
              const active = selectedFactors.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFactor(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#8C7A6B] text-white'
                      : 'bg-[#F4EDE2] text-[#5C4F44] hover:bg-[#EAE0D2]'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-[#3C3C3C] mb-1.5">
            Anotações breves (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Crianças dormiram no horário, consegui ler um pouco..."
            className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B] resize-none h-20 placeholder:text-[#A8988B]"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Salvar registro</span>
        </button>
      </div>
    </div>
  );
};
