import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Plus, Sun, Home, Moon, Sparkles } from 'lucide-react';
import { PeriodKey } from '../types';

export const RoutineModal: React.FC = () => {
  const {
    activePeriodModal,
    setActivePeriodModal,
    routineTasks,
    toggleRoutineTask,
    addRoutineTask
  } = useApp();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!activePeriodModal) return null;

  const periodMeta: Record<PeriodKey, { title: string; icon: React.ReactNode; desc: string }> = {
    manha: {
      title: 'Rotina da Manhã',
      icon: <Sun className="w-5 h-5 text-[#C58B68]" />,
      desc: 'Comece o dia com leveza e foco'
    },
    tarde: {
      title: 'Rotina da Tarde',
      icon: <Home className="w-5 h-5 text-[#8C7A6B]" />,
      desc: 'Organização e ritmo para a tarde'
    },
    noite: {
      title: 'Rotina da Noite',
      icon: <Moon className="w-5 h-5 text-[#70647C]" />,
      desc: 'Desacelere e prepare o descanso'
    },
    especiais: {
      title: 'Cuidados Especiais',
      icon: <Sparkles className="w-5 h-5 text-[#B78A58]" />,
      desc: 'Autocuidado e tarefas periódicas'
    }
  };

  const currentMeta = periodMeta[activePeriodModal];
  const tasks = routineTasks.filter((t) => t.period === activePeriodModal);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addRoutineTask({
      title: newTaskTitle.trim(),
      subtitle: newTaskTime ? `Horário: ${newTaskTime}` : undefined,
      period: activePeriodModal,
      time: newTaskTime || undefined
    });
    setNewTaskTitle('');
    setNewTaskTime('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center">
              {currentMeta.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">{currentMeta.title}</h2>
              <p className="text-xs text-[#8C7A6B]">{currentMeta.desc}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActivePeriodModal(null);
              setIsAdding(false);
            }}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task List */}
        <div className="py-4 space-y-2.5">
          {tasks.length === 0 ? (
            <p className="text-xs text-center text-[#8C7A6B] py-6">
              Nenhuma atividade cadastrada para este período.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleRoutineTask(task.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  task.completed
                    ? 'bg-[#F2ECE2] border-[#DDD3C5] opacity-75'
                    : 'bg-[#FAF8F5] border-[#EFE8DE] hover:bg-[#F6EFE6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                      task.completed
                        ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white'
                        : 'border-[#C4B6A6] bg-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span
                      className={`text-xs sm:text-sm font-semibold block ${
                        task.completed ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.subtitle && (
                      <span className="text-[11px] text-[#8C7A6B]">{task.subtitle}</span>
                    )}
                  </div>
                </div>

                {task.time && (
                  <span className="text-[10px] text-[#8C7A6B] font-medium bg-[#EFE8DE] px-2 py-0.5 rounded-md">
                    {task.time}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add task block */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar nova atividade</span>
          </button>
        ) : (
          <form onSubmit={handleAddTask} className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3.5 space-y-2.5">
            <input
              type="text"
              placeholder="Nome da atividade (ex: Tomar chá, Ler 10 páginas)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
              autoFocus
            />
            <input
              type="text"
              placeholder="Horário sugerido (ex: 08:30 ou Noite)"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
              className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
            />
            <div className="flex gap-2">
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
