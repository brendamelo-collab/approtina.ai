import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  ColorPalette,
  FontSizeScale,
  MoodEntry,
  MoodValue,
  MoodOption,
  MoodRecord,
  FactorOption,
  DayPeriod,
  AgendaItem,
  AgendaCategory,
  WeeklyFixedTopic,
  RoutineTask,
  RoutineTaskReminder,
  DailyChronologicalStep,
  PeriodKey,
  ContextualReminder,
  HealthDateItem,
  HealthMedication,
  HealthNoteItem,
  HealthGroup,
  GoalItem,
  GoalCategory,
  RecurringTaskItem,
  AppNotification,
  QuestionResponseValue,
  LifeArea,
  QuestionGroup,
  QuestionItem,
  QuestionResponse,
  QuestionChoice,
  NavTab,
  BottomNavSlot,
  MonthlyReviewData,
  TaskExecutionRecord,
  NotificationPreferences,
  MemberType,
  ActivityLog,
  ActivityStatus,
  DataMaintenance
} from '../types';
import { resolveResponseValue } from '../utils/routineCalculations';
import { todayISO } from '../utils/dateUtils';
import { playWebSound, speakText } from '../utils/alarmSounds';
import { auth, onAuthStateChanged, saveUserRealtimeData, loadUserRealtimeData, logoutFirebase } from '../firebase';

// Maps each synced state field to its localStorage key suffix (must match the persist effect)
const CLOUD_SYNC_FIELDS: Record<string, string> = {
  profiles: 'profiles',
  bottomNavSlots: 'bottom_nav_slots',
  notificationPreferences: 'notif_prefs',
  moodOptions: 'mood_options',
  moodRecords: 'mood_records',
  availableFactors: 'available_factors',
  dayFactors: 'day_factors',
  dayNotes: 'day_notes',
  lifeAreas: 'life_areas',
  questionGroups: 'question_groups',
  questions: 'questions',
  questionResponses: 'question_responses',
  agendaItems: 'agenda_items',
  agendaCategories: 'agenda_categories',
  weeklyFixedTopics: 'weekly_topics',
  routineTasks: 'routine_tasks',
  dailyChronologicalSteps: 'daily_chrono_steps',
  healthDateItems: 'health_dates',
  healthMedications: 'health_meds',
  healthNoteItems: 'health_notes',
  healthGroups: 'health_groups',
  goals: 'goals',
  goalCategories: 'goal_categories',
  recurringTasks: 'recurring_tasks',
  recurringHistory: 'recurring_history',
  notifications: 'notifications',
  activityLog: 'activity_log',
  dataMaintenance: 'data_maintenance'
};

export interface ActiveAlarmPayload {
  id: string;
  type: 'medicamento' | 'rotina' | 'agenda';
  title: string;
  subtitle?: string;
  time: string;
  memberName?: string;
  dosage?: string;
  key?: string; // scheduler id (used to snooze)
  voice?: boolean; // speak the reminder out loud
}

interface AppContextType {
  // Profiles & Family Management (Real vs Ghost)
  profiles: UserProfile[];
  currentProfile: UserProfile;
  switchProfile: (profileId: string) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  addProfile: (profile: Omit<UserProfile, 'id'>) => void;
  deleteProfile: (id: string) => void;

  // Customizable Bottom Navigation
  bottomNavSlots: BottomNavSlot[];
  setBottomNavSlots: (slots: BottomNavSlot[]) => void;
  isCustomizingNavOpen: boolean;
  setIsCustomizingNavOpen: (open: boolean) => void;
  resetBottomNavToDefault: () => void;

  // Color Palette & Typography Font Size
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
  fontSizeScale: FontSizeScale;
  setFontSizeScale: (scale: FontSizeScale) => void;

  // Preferences & Data
  notificationPreferences: NotificationPreferences;
  toggleNotificationPreference: (key: keyof NotificationPreferences) => void;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;

  // Histórico diário (relatórios) e revisão dos dados de exemplo
  activityLog: ActivityLog;
  dataMaintenance: DataMaintenance;
  demoCandidates: DemoCandidate[];
  demoRemovedCount: number;
  removeDemoItems: (items: { field: DemoField; id: string }[]) => void;
  keepDemoItems: (items: { field: DemoField; id: string }[]) => void;
  undoDemoCleanup: () => void;
  exportAppData: () => string;
  importAppData: (jsonString: string) => boolean;
  resetAppToDefaults: () => void;

  // Date selection
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Meu Mapa - Mood Options Management
  moodOptions: MoodOption[];
  addMoodOption: (mood: Omit<MoodOption, 'id'>) => void;
  updateMoodOption: (id: string, updates: Partial<MoodOption>) => void;
  deleteMoodOption: (id: string) => void;

  // Meu Mapa - Mood Records
  moodRecords: MoodRecord[];
  moodEntries: MoodRecord[];
  currentMood: MoodRecord | null;
  savePeriodMood: (record: Omit<MoodRecord, 'id' | 'timestamp'>) => void;
  saveMoodEntry: (moodValue: string, note?: string) => void;
  deleteMoodRecord: (id: string) => void;
  getMoodRecordsForDate: (date: string) => MoodRecord[];

  // Meu Mapa - Factors Management (per-day independent selection)
  availableFactors: FactorOption[];
  addCustomFactor: (label: string, icon?: string) => string;
  updateCustomFactor: (id: string, label: string, icon?: string) => void;
  deleteCustomFactor: (id: string) => void;
  dayFactors: Record<string, string[]>; // date -> factorIds
  toggleDayFactor: (date: string, factorId: string) => void;

  // Day Notes
  dayNotes: Record<string, string>;
  setDayNotesForDate: (date: string, notes: string) => void;

  // Meu Mapa - Life Areas, Groups, Questions (Total editability)
  lifeAreas: LifeArea[];
  createLifeArea: (name: string, icon?: string) => void;
  updateLifeArea: (id: string, name: string, icon?: string) => void;
  deleteLifeArea: (id: string) => void;
  reorderArea: (id: string, direction: 'up' | 'down') => void;

  questionGroups: QuestionGroup[];
  createQuestionGroup: (areaId: string, name: string) => void;
  updateQuestionGroup: (id: string, name: string) => void;
  deleteQuestionGroup: (id: string) => void;
  reorderGroup: (id: string, direction: 'up' | 'down') => void;

  questions: QuestionItem[];
  createQuestion: (question: Omit<QuestionItem, 'id'>) => void;
  updateQuestion: (id: string, updates: Partial<QuestionItem>) => void;
  deleteQuestion: (id: string) => void;
  duplicateQuestion: (id: string) => void;
  reorderQuestion: (id: string, direction: 'up' | 'down') => void;
  addQuestionFromAi: (data: {
    areaName: string;
    groupName: string;
    title: string;
    habitType: 'bom' | 'ruim';
    positiveIf?: 'sim' | 'nao';
    frequency?: 'todos_os_dias';
  }) => QuestionItem;

  questionResponses: QuestionResponse[];
  setQuestionResponse: (
    questionId: string,
    date: string,
    value: QuestionResponseValue,
    note?: string
  ) => void;
  recordChoiceResponse: (
    questionId: string,
    date: string,
    choice: QuestionChoice,
    note?: string
  ) => void;
  getQuestionResponse: (questionId: string, date: string) => QuestionResponse | undefined;

  // Modals & Navigation
  isManageQuestionsModalOpen: boolean;
  setIsManageQuestionsModalOpen: (open: boolean) => void;
  isRelatoriosModalOpen: boolean;
  setIsRelatoriosModalOpen: (open: boolean) => void;
  isMaisDrawerOpen: boolean;
  setIsMaisDrawerOpen: (open: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  isMoodModalOpen: boolean;
  setIsMoodModalOpen: (open: boolean) => void;
  isAgendaModalOpen: boolean;
  setIsAgendaModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Global Interactive Alarm Modal (Balão + Alarme)
  activeAlarm: ActiveAlarmPayload | null;
  triggerAlarm: (payload: ActiveAlarmPayload) => void;
  dismissAlarm: () => void;
  confirmAlarmAction: (action: 'viu' | 'fez' | 'adiar', snoozeMinutes?: number) => void;

  // Agenda & Categories & Weekly Fixed Topics
  agendaItems: AgendaItem[];
  addAgendaItem: (item: Omit<AgendaItem, 'id' | 'completed'>) => void;
  updateAgendaItem: (id: string, updates: Partial<AgendaItem>) => void;
  toggleAgendaItem: (id: string) => void;
  deleteAgendaItem: (id: string) => void;
  agendaCategories: AgendaCategory[];
  addAgendaCategory: (cat: Omit<AgendaCategory, 'id'>) => void;
  updateAgendaCategory: (id: string, updates: Partial<AgendaCategory>) => void;
  deleteAgendaCategory: (id: string) => void;
  weeklyFixedTopics: WeeklyFixedTopic[];
  addWeeklyFixedTopic: (topic: Omit<WeeklyFixedTopic, 'id'>) => void;
  updateWeeklyFixedTopic: (id: string, updates: Partial<WeeklyFixedTopic>) => void;
  deleteWeeklyFixedTopic: (id: string) => void;

  // Rotinas (Part 1: Semanal, Part 2: Hábitos e Tarefas Semanais, Part 3: Diária Cronológica)
  routineTasks: RoutineTask[];
  toggleRoutineTask: (id: string) => void;
  addRoutineTask: (task: Omit<RoutineTask, 'id' | 'completed'>) => void;
  updateRoutineTask: (id: string, updates: Partial<RoutineTask>) => void;
  deleteRoutineTask: (id: string) => void;
  activePeriodModal: PeriodKey | null;
  setActivePeriodModal: (period: PeriodKey | null) => void;

  dailyChronologicalSteps: DailyChronologicalStep[];
  toggleDailyChronologicalStep: (id: string) => void;
  addDailyChronologicalStep: (step: Omit<DailyChronologicalStep, 'id' | 'completed'>) => void;
  updateDailyChronologicalStep: (id: string, updates: Partial<DailyChronologicalStep>) => void;
  deleteDailyChronologicalStep: (id: string) => void;
  speakVoiceReminder: (text: string) => void;

  // Contextual Reminders
  contextualReminders: ContextualReminder[];
  dismissContextualReminder: (id: string) => void;

  // MÓDULO SAÚDE (3 Abas: Datas, Medicamentos, Anotações)
  healthDateItems: HealthDateItem[];
  addHealthDateItem: (item: Omit<HealthDateItem, 'id' | 'completed'>) => void;
  updateHealthDateItem: (id: string, updates: Partial<HealthDateItem>) => void;
  deleteHealthDateItem: (id: string) => void;
  toggleHealthDateItem: (id: string) => void;

  healthMedications: HealthMedication[];
  addHealthMedication: (item: Omit<HealthMedication, 'id' | 'confirmed'>) => void;
  updateHealthMedication: (id: string, updates: Partial<HealthMedication>) => void;
  deleteHealthMedication: (id: string) => void;
  toggleHealthMedication: (id: string) => void;
  setMedicationStatus: (id: string, status: 'pendente' | 'viu' | 'fez' | 'adiado', snoozeMinutes?: number) => void;

  healthNoteItems: HealthNoteItem[];
  addHealthNoteItem: (item: Omit<HealthNoteItem, 'id'>) => void;
  updateHealthNoteItem: (id: string, updates: Partial<HealthNoteItem>) => void;
  deleteHealthNoteItem: (id: string) => void;

  selectedHealthMemberId: string;
  setSelectedHealthMemberId: (id: string) => void;

  healthGroups: HealthGroup[];
  addHealthGroup: (group: Omit<HealthGroup, 'id'>) => void;
  updateHealthGroup: (id: string, updates: Partial<HealthGroup>) => void;
  deleteHealthGroup: (id: string) => void;

  // Aliases for Cuidados backwards compatibility
  healthItems: HealthMedication[];
  toggleHealthItem: (id: string) => void;
  addHealthItem: (item: Omit<HealthMedication, 'id' | 'confirmed'>) => void;
  deleteHealthItem: (id: string) => void;

  // Metas (com categorias e prazo específico ou contagem regressiva)
  goals: GoalItem[];
  goalCategories: GoalCategory[];
  addGoalCategory: (cat: Omit<GoalCategory, 'id'>) => void;
  updateGoalCategory: (id: string, updates: Partial<GoalCategory>) => void;
  deleteGoalCategory: (id: string) => void;
  toggleGoalStep: (goalId: string, stepId: string) => void;
  addGoal: (goal: Omit<GoalItem, 'id' | 'progressPercent' | 'completedSteps' | 'totalSteps'>) => void;
  updateGoal: (id: string, updates: Partial<GoalItem>) => void;
  deleteGoal: (id: string) => void;

  // Tarefas Recorrentes
  recurringTasks: RecurringTaskItem[];
  recurringHistory: TaskExecutionRecord[];
  completeRecurringTask: (id: string) => void;
  addRecurringTask: (task: Omit<RecurringTaskItem, 'id' | 'status'>) => void;
  updateRecurringTask: (id: string, updates: Partial<RecurringTaskItem>) => void;
  deleteRecurringTask: (id: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  addAppNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'time'>) => void;

  // User Auth State
  userEmail: string;
  isLoggedIn: boolean;
  authReady: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'rotina_ai_master_v3';

// Default Profiles: Brenda (real), Bryan (fantasma), Benício (fantasma), Lucas (real)
const defaultProfiles: UserProfile[] = [
  {
    id: 'p1',
    name: 'Brenda',
    role: 'Mãe',
    subtitle: 'Administradora da Família',
    isPrimary: true,
    memberType: 'real',
    email: 'brenda.m.magalhaes@gmail.com',
    color: '#8C7A6B'
  },
  {
    id: 'p2',
    name: 'Bryan',
    role: 'Filho (6 anos)',
    subtitle: 'Ruivo alegre e esperto',
    memberType: 'fantasma',
    color: '#D97706'
  },
  {
    id: 'p3',
    name: 'Benício',
    role: 'Filho (3 anos)',
    subtitle: 'Moreno carinhoso e curioso',
    memberType: 'fantasma',
    color: '#2563EB'
  },
  {
    id: 'p4',
    name: 'Lucas',
    role: 'Pai / Cônjuge',
    subtitle: 'Parceiro de rotina',
    memberType: 'real',
    email: 'lucas.familia@gmail.com',
    color: '#059669'
  }
];

// Default Customizable Bottom Nav Slots (User can edit anytime!)
const defaultBottomNavSlots: BottomNavSlot[] = [
  { tab: 'inicio', label: 'Início', icon: 'Home' },
  { tab: 'mapa', label: 'Meu Mapa', icon: 'Compass' },
  { tab: 'rotinas', label: 'Rotinas', icon: 'CalendarDays' },
  { tab: 'relatorios', label: 'Relatórios', icon: 'BarChart2' },
  { tab: 'ia', label: 'Assistente', icon: 'Bot' }
];

// Default Mood Options
const defaultMoodOptions: MoodOption[] = [
  { id: 'muito_bem', emoji: '😃', label: 'Muito Bem', intensity: 5, visible: true },
  { id: 'bem', emoji: '😊', label: 'Bem', intensity: 4, visible: true },
  { id: 'neutro', emoji: '😐', label: 'Neutro', intensity: 3, visible: true },
  { id: 'triste', emoji: '😔', label: 'Triste', intensity: 2, visible: true },
  { id: 'irritado', emoji: '😠', label: 'Irritado', intensity: 1, visible: true },
  { id: 'ansioso', emoji: '🥺', label: 'Ansioso', intensity: 2, visible: true },
  { id: 'sobrecarregado', emoji: '😫', label: 'Sobrecarregado', intensity: 1, visible: true }
];

// Default Factors
const defaultAvailableFactors: FactorOption[] = [
  { id: 'sono_ruim', label: 'Noite mal dormida', icon: '😴', category: 'fisico', visible: true },
  { id: 'cansaco_fisico', label: 'Cansaço físico', icon: '🔋', category: 'fisico', visible: true },
  { id: 'sobrecarga_criancas', label: 'Sobrecarga com as crianças', icon: '👶', category: 'emocional', visible: true },
  { id: 'financas', label: 'Preocupações financeiras', icon: '💸', category: 'rotina', visible: true },
  { id: 'falta_tempo', label: 'Falta de tempo pessoal', icon: '⏳', category: 'emocional', visible: true },
  { id: 'discussoes', label: 'Discussões / Desentendimentos', icon: '⚡', category: 'familiar', visible: true },
  { id: 'dor', label: 'Dor ou desconforto físico', icon: '🤕', category: 'fisico', visible: true },
  { id: 'dia_tranquilo', label: 'Dia tranquilo e sereno', icon: '🌿', category: 'emocional', visible: true },
  { id: 'passeio', label: 'Passeio ao ar livre', icon: '☀️', category: 'familiar', visible: true },
  { id: 'apoio_parceiro', label: 'Apoio do parceiro / rede', icon: '🤝', category: 'familiar', visible: true },
  { id: 'alimentacao_boa', label: 'Alimentação saudável', icon: '🥗', category: 'fisico', visible: true }
];

const defaultNotificationPreferences: NotificationPreferences = {
  routineReminders: true,
  agendaReminders: true,
  mapaDailyReminder: true,
  soundAlerts: true,
  voiceAlerts: true
};

const defaultLifeAreas: LifeArea[] = [
  { id: 'area-maternidade', name: 'Maternidade', icon: '👶', order: 1 },
  { id: 'area-emocional', name: 'Meu Emocional', icon: '💖', order: 2 },
  { id: 'area-casa', name: 'Organização da Casa', icon: '🏠', order: 3 },
  { id: 'area-saude', name: 'Saúde & Autocuidado', icon: '🌿', order: 4 },
  { id: 'area-financas', name: 'Finanças & Família', icon: '💰', order: 5 }
];

const defaultQuestionGroups: QuestionGroup[] = [
  { id: 'grp-mae-comportamento', areaId: 'area-maternidade', name: 'Meu Comportamento com os Filhos', order: 1 },
  { id: 'grp-atencao-criancas', areaId: 'area-maternidade', name: 'Atenção & Sono das Crianças', order: 2 },
  { id: 'grp-emocional-limites', areaId: 'area-emocional', name: 'Equilíbrio & Limites', order: 1 },
  { id: 'grp-casa-rotina', areaId: 'area-casa', name: 'Rotina e Harmonia do Lar', order: 1 },
  { id: 'grp-saude-habitos', areaId: 'area-saude', name: 'Hábitos do Corpo e Mente', order: 1 }
];

const defaultQuestions: QuestionItem[] = [
  // Maternidade - Grupo 1: Comportamento
  {
    id: 'q-afeto',
    groupId: 'grp-mae-comportamento',
    areaId: 'area-maternidade',
    title: 'Dediquei tempo exclusivo de afeto/brincadeira com os meninos?',
    habitType: 'bom',
    positiveIf: 'sim',
    positiveLabel: 'Sim, reservei momento de afeto',
    negativeLabel: 'Não consegui me conectar hoje',
    frequency: 'todos_os_dias',
    order: 1
  },
  {
    id: 'q-paciencia',
    groupId: 'grp-mae-comportamento',
    areaId: 'area-maternidade',
    title: 'Gritei ou perdi a paciência com as crianças?',
    habitType: 'ruim',
    positiveIf: 'nao',
    positiveLabel: 'Mantive a calma / Não gritei',
    negativeLabel: 'Perdi a paciência / Gritei',
    frequency: 'todos_os_dias',
    order: 2
  },
  // Maternidade - Grupo 2: Sono & Atenção
  {
    id: 'q-sono-criancas',
    groupId: 'grp-atencao-criancas',
    areaId: 'area-maternidade',
    title: 'As crianças foram para a cama no horário estipulado?',
    habitType: 'bom',
    positiveIf: 'sim',
    positiveLabel: 'Sim, dormiram no horário planejado',
    negativeLabel: 'Não, dormiram tarde ou com resistência',
    frequency: 'todos_os_dias',
    order: 1
  },
  // Emocional
  {
    id: 'q-tempo-para-mim',
    groupId: 'grp-emocional-limites',
    areaId: 'area-emocional',
    title: 'Reservei ao menos 15 minutos para mim mesma sem culpa?',
    habitType: 'bom',
    positiveIf: 'sim',
    positiveLabel: 'Sim, tive minha pausa merecida',
    negativeLabel: 'Não tive nenhum momento pessoal',
    frequency: 'todos_os_dias',
    order: 1
  },
  {
    id: 'q-sobrecarga',
    groupId: 'grp-emocional-limites',
    areaId: 'area-emocional',
    title: 'Senti-me sobrecarregada a ponto de paralisar?',
    habitType: 'ruim',
    positiveIf: 'nao',
    positiveLabel: 'Dia leve / Sobrecarga controlada',
    negativeLabel: 'Senti exaustão e paralisia',
    frequency: 'todos_os_dias',
    order: 2
  },
  // Casa
  {
    id: 'q-pia-limpa',
    groupId: 'grp-casa-rotina',
    areaId: 'area-casa',
    title: 'A pia e bancadas ficaram limpas ao final do dia?',
    habitType: 'bom',
    positiveIf: 'sim',
    positiveLabel: 'Pia organizada e limpa',
    negativeLabel: 'Pia cheia / Desorganizada',
    frequency: 'todos_os_dias',
    order: 1
  },
  // Saúde
  {
    id: 'q-agua',
    groupId: 'grp-saude-habitos',
    areaId: 'area-saude',
    title: 'Bebi pelo menos 2 litros de água ao longo do dia?',
    habitType: 'bom',
    positiveIf: 'sim',
    positiveLabel: 'Hidratação em dia (+2L)',
    negativeLabel: 'Bebi pouca água',
    frequency: 'todos_os_dias',
    order: 1
  }
];

// Default Agenda Categories
const defaultAgendaCategories: AgendaCategory[] = [
  { id: 'cat-familia', name: 'Família & Crianças', icon: '👨‍👩‍👧‍👦', color: '#8C7A6B' },
  { id: 'cat-esporte', name: 'Esportes & Lazer', icon: '⚽', color: '#2563EB' },
  { id: 'cat-saude', name: 'Saúde & Consultas', icon: '🩺', color: '#059669' },
  { id: 'cat-escola', name: 'Escola & Estudos', icon: '🎒', color: '#D97706' },
  { id: 'cat-pessoal', name: 'Pessoal & Autocuidado', icon: '✨', color: '#7C3AED' },
  { id: 'cat-trabalho', name: 'Trabalho & Finanças', icon: '💼', color: '#4B5563' }
];

// Default Weekly Fixed Topics (e.g. Sexta: Dia do Filme)
const defaultWeeklyFixedTopics: WeeklyFixedTopic[] = [
  { id: 'wft-1', dayOfWeek: 1, dayName: 'Segunda-feira', title: 'Planejamento Semanal & Feira', icon: '📋', time: '09:00', description: 'Revisar cardápio e mantimentos' },
  { id: 'wft-2', dayOfWeek: 2, dayName: 'Terça-feira', title: 'Futebol das crianças', icon: '⚽', time: '17:00', description: 'Bryan e Benício no treino' },
  { id: 'wft-3', dayOfWeek: 3, dayName: 'Quarta-feira', title: 'Dia de Hortifruti Fresco', icon: '🥦', time: '10:00', description: 'Frutas e verduras da semana' },
  { id: 'wft-4', dayOfWeek: 4, dayName: 'Quinta-feira', title: 'Lavagem de Roupas Grandes', icon: '🧺', time: '08:30', description: 'Toalhas e lençóis' },
  { id: 'wft-5', dayOfWeek: 5, dayName: 'Sexta-feira', title: 'Noite do Filme em Família com Pipoca', icon: '🎬', time: '19:30', description: 'Momento cinema e aconchego' },
  { id: 'wft-6', dayOfWeek: 6, dayName: 'Sábado', title: 'Passeio ao ar livre / Parque', icon: '🌳', time: '15:30', description: 'Sol, ar puro e correria' },
  { id: 'wft-7', dayOfWeek: 0, dayName: 'Domingo', title: 'Almoço Especial & Desaceleração', icon: '🍝', time: '13:00', description: 'Família reunida e descanso' }
];

// Default Agenda Items
const defaultAgendaItems: AgendaItem[] = [
  {
    id: 'ag-1',
    title: 'Organizar a casa e brinquedos',
    date: '2026-11-16',
    time: '08:00',
    displayDay: 'Hoje',
    isRecurring: false,
    completed: true,
    category: 'familia',
    categoryId: 'cat-familia',
    icon: '🕒',
    reminderMinutes: 15
  },
  {
    id: 'ag-2',
    title: 'Preparar o almoço',
    date: '2026-11-16',
    time: '10:30',
    displayDay: 'Hoje',
    isRecurring: false,
    completed: true,
    category: 'familia',
    categoryId: 'cat-familia',
    icon: '🍲',
    reminderMinutes: 15
  },
  {
    id: 'ag-3',
    title: 'Atividade com as crianças',
    date: '2026-11-16',
    time: '15:00',
    displayDay: 'Hoje',
    isRecurring: false,
    completed: false,
    category: 'familia',
    categoryId: 'cat-familia',
    icon: '🎨',
    reminderMinutes: 15
  },
  {
    id: 'ag-4',
    title: 'Futebol das crianças',
    date: '2026-11-18',
    time: '17:00',
    displayDay: 'Terça-feira',
    isRecurring: true,
    recurrenceType: 'semanal',
    recurrenceIntervalDays: 7,
    recurrenceLabel: 'Semanalmente às Terças',
    completed: false,
    category: 'esporte',
    categoryId: 'cat-esporte',
    icon: '⚽',
    reminderMinutes: 30,
    hasVisualNotification: true,
    alarmEnabled: true
  }
];

// Default Routine Tasks
const defaultRoutineTasks: RoutineTask[] = [
  {
    id: 'rt-1',
    title: 'Skincare matinal com protetor solar',
    subtitle: 'Autocuidado essencial',
    period: 'manha',
    completed: true,
    time: '07:30',
    groupName: 'Autocuidado Matinal',
    subgroupName: 'Rosto',
    reminder: { enabled: true, balloon: true, alarm: true, sound: true, voiceAlert: true }
  },
  {
    id: 'rt-2',
    title: 'Pente fino nas crianças',
    subtitle: 'Antes de sair para a escola',
    period: 'manha',
    completed: true,
    time: '08:00',
    groupName: 'Higiene & Filhos',
    subgroupName: 'Bryan e Benício',
    reminder: { enabled: true, balloon: true, alarm: true, sound: true, voiceAlert: true }
  },
  {
    id: 'rt-3',
    title: 'Suplemento infantil',
    subtitle: '1 dose com frutas',
    period: 'manha',
    completed: false,
    time: '09:00',
    groupName: 'Saúde Infantil',
    subgroupName: 'Vitaminas',
    reminder: { enabled: true, balloon: true, alarm: true, sound: true, voiceAlert: true }
  },
  {
    id: 'rt-4',
    title: 'Almoço nutritivo em família',
    subtitle: 'Momento de desconectar telas',
    period: 'tarde',
    completed: true,
    time: '12:30',
    groupName: 'Alimentação',
    subgroupName: 'Refeições',
    reminder: { enabled: false, balloon: true, alarm: false, sound: false, voiceAlert: false }
  },
  {
    id: 'rt-5',
    title: 'Acompanhar lição de casa do Bryan',
    subtitle: 'Incentivo e leitura diária',
    period: 'tarde',
    completed: false,
    time: '14:30',
    groupName: 'Desenvolvimento',
    subgroupName: 'Bryan (6 anos)',
    reminder: { enabled: true, balloon: true, alarm: false, sound: false, voiceAlert: true }
  },
  {
    id: 'rt-6',
    title: 'Organizar a sala e brinquedos',
    subtitle: '15 minutos com as crianças',
    period: 'tarde',
    completed: false,
    time: '16:00',
    groupName: 'Casa & Brinquedos',
    subgroupName: 'Sala',
    reminder: { enabled: false, balloon: true, alarm: false, sound: false, voiceAlert: false }
  },
  {
    id: 'rt-7',
    title: 'Banho relaxante das crianças',
    subtitle: 'Água morna e pijama',
    period: 'noite',
    completed: false,
    time: '19:45',
    groupName: 'Ritual Noturno',
    subgroupName: 'Banho',
    reminder: { enabled: true, balloon: true, alarm: true, sound: true, voiceAlert: true }
  },
  {
    id: 'rt-8',
    title: 'Skincare noturno',
    subtitle: 'Limpeza e hidratação profunda',
    period: 'noite',
    completed: false,
    time: '21:00',
    groupName: 'Autocuidado Noturno',
    subgroupName: 'Rosto',
    reminder: { enabled: true, balloon: true, alarm: false, sound: false, voiceAlert: false }
  },
  {
    id: 'rt-9',
    title: 'História e oração para dormir',
    subtitle: 'Carinho e sono tranquilo',
    period: 'noite',
    completed: false,
    time: '21:30',
    groupName: 'Ritual Noturno',
    subgroupName: 'Sono',
    reminder: { enabled: true, balloon: true, alarm: true, sound: true, voiceAlert: true }
  },
  {
    id: 'rt-10',
    title: 'Esfoliação corporal',
    subtitle: 'Durante o banho da noite • Seg, Qua e Sex',
    period: 'especiais',
    completed: false,
    time: '20:15',
    groupName: 'Cuidados Especiais',
    subgroupName: 'Corpo',
    reminder: { enabled: true, balloon: true, alarm: true, sound: true, voiceAlert: true }
  },
  {
    id: 'rt-11',
    title: 'Hidratação profunda capilar',
    subtitle: 'Máscara nutritiva de 20 min • Domingo',
    period: 'especiais',
    completed: true,
    time: 'Domingo',
    groupName: 'Cuidados Especiais',
    subgroupName: 'Cabelos',
    reminder: { enabled: false, balloon: true, alarm: false, sound: false, voiceAlert: false }
  }
];

// Dedicated Daily Chronological Steps (Passo a passo com voz)
const defaultDailyChronologicalSteps: DailyChronologicalStep[] = [
  { id: 'dcs-1', time: '06:45', title: 'Acordar e beber 500ml de água', icon: '💧', completed: true, voiceAlert: true, period: 'manha' },
  { id: 'dcs-2', time: '07:15', title: 'Preparar café da manhã com as crianças', icon: '🍳', completed: true, voiceAlert: true, period: 'manha' },
  { id: 'dcs-3', time: '07:45', title: 'Skincare e protetor solar', icon: '🧴', completed: true, voiceAlert: true, period: 'manha' },
  { id: 'dcs-4', time: '08:00', title: 'Pente fino nas crianças e saída escolar', icon: '🎒', completed: true, voiceAlert: true, period: 'manha' },
  { id: 'dcs-5', time: '08:30', title: 'Organizar a sala e bancadas da cozinha', icon: '🧹', completed: false, voiceAlert: false, period: 'manha' },
  { id: 'dcs-6', time: '10:30', title: 'Começar preparo do almoço nutritivo', icon: '🍲', completed: false, voiceAlert: true, period: 'manha' },
  { id: 'dcs-7', time: '12:30', title: 'Almoço em família sem telas', icon: '🍽️', completed: false, voiceAlert: false, period: 'tarde' },
  { id: 'dcs-8', time: '14:30', title: 'Lição de casa do Bryan e brincadeira calma', icon: '📚', completed: false, voiceAlert: true, period: 'tarde' },
  { id: 'dcs-9', time: '16:00', title: 'Pequena pausa de 15 minutos para um café', icon: '☕', completed: false, voiceAlert: false, period: 'tarde' },
  { id: 'dcs-10', time: '17:00', title: 'Compromisso da tarde / Futebol dos meninos', icon: '⚽', completed: false, voiceAlert: true, period: 'tarde' },
  { id: 'dcs-11', time: '19:30', title: 'Banho relaxante das crianças', icon: '🛁', completed: false, voiceAlert: true, period: 'noite' },
  { id: 'dcs-12', time: '20:15', title: 'Esfoliação corporal suave no meu banho', icon: '🧖‍♀️', completed: false, voiceAlert: true, period: 'noite' },
  { id: 'dcs-13', time: '21:00', title: 'História infantil e ritual de oração', icon: '📖', completed: false, voiceAlert: true, period: 'noite' },
  { id: 'dcs-14', time: '22:00', title: 'Desligar telas e desaceleração do sono', icon: '🌙', completed: false, voiceAlert: false, period: 'noite' }
];

// SAÚDE MODULE - ABA 1: DATAS (Consultas, Exames, Vacinas, Prazos)
const defaultHealthDateItems: HealthDateItem[] = [
  {
    id: 'hd-1',
    memberId: 'p2',
    memberName: 'Bryan',
    title: 'Consulta de Rotina Pediatra',
    date: '2026-11-28',
    time: '14:00',
    type: 'consulta',
    professionalOrClinic: 'Dra. Helena Ribeiro - Clínica Crescer',
    notes: 'Checar peso, altura e evolução da fala.',
    completed: false
  },
  {
    id: 'hd-2',
    memberId: 'p3',
    memberName: 'Benício',
    title: 'Vacina de Reforço 3 Anos',
    date: '2026-12-05',
    time: '09:30',
    type: 'vacina',
    professionalOrClinic: 'Posto Central de Saúde',
    notes: 'Levar carteirinha de vacinação e documento.',
    completed: false
  },
  {
    id: 'hd-3',
    memberId: 'p1',
    memberName: 'Brenda',
    title: 'Exame de Sangue Periódico (Ferritina & Vitamina D)',
    date: '2026-11-22',
    time: '07:30',
    type: 'exame',
    professionalOrClinic: 'Laboratório Sabin',
    notes: 'Jejum obrigatório de 8 horas.',
    completed: false
  },
  {
    id: 'hd-4',
    memberId: 'p4',
    memberName: 'Lucas',
    title: 'Consulta no Oftalmologista',
    date: '2026-12-10',
    time: '16:00',
    type: 'consulta',
    professionalOrClinic: 'Dr. Fernando Dias',
    notes: 'Renovação da receita dos óculos de grau.',
    completed: false
  }
];

// SAÚDE MODULE - ABA 2: MEDICAMENTOS & SUPLEMENTOS (Com alarme, balão e botões Viu, Fez, Adiar)
const defaultHealthMedications: HealthMedication[] = [
  {
    id: 'hm-1',
    name: 'Ômega 3 Puro',
    dosage: '1 cápsula (1000mg)',
    frequency: 'Todos os dias • Manhã',
    memberId: 'p1',
    memberName: 'Brenda',
    time: '09:00',
    confirmed: true,
    category: 'suplemento',
    alarmEnabled: true,
    balloonAlert: true,
    soundAlert: true,
    status: 'fez',
    instructions: 'Tomar com água logo após o café da manhã.'
  },
  {
    id: 'hm-2',
    name: 'Ferro Quelato + Vitamina C',
    dosage: '1 cápsula com suco de laranja',
    frequency: '2x por semana • Seg e Qui',
    memberId: 'p1',
    memberName: 'Brenda',
    time: '12:00',
    confirmed: true,
    category: 'medicamento',
    alarmEnabled: true,
    balloonAlert: true,
    soundAlert: true,
    status: 'fez',
    instructions: 'Evitar laticínios 1 hora antes e depois.'
  },
  {
    id: 'hm-3',
    name: 'Suplemento Infantil Multivitaminas',
    dosage: '1 dose (5ml)',
    frequency: 'Todos os dias • 09:00',
    memberId: 'p2',
    memberName: 'Bryan',
    time: '09:00',
    confirmed: true,
    category: 'suplemento',
    alarmEnabled: true,
    balloonAlert: true,
    soundAlert: true,
    status: 'fez',
    instructions: 'Dar na colherzinha com suco ou fruta amassada.'
  },
  {
    id: 'hm-4',
    name: 'Vitamina D3 em Gotas',
    dosage: '2 gotas pela manhã',
    frequency: 'Todos os dias • 09:00',
    memberId: 'p3',
    memberName: 'Benício',
    time: '09:00',
    confirmed: false,
    category: 'suplemento',
    alarmEnabled: true,
    balloonAlert: true,
    soundAlert: true,
    status: 'pendente',
    instructions: 'Pingar direto na fruta matinal.'
  }
];

// SAÚDE MODULE - ABA 3: ANOTAÇÕES & MEDIÇÕES POR MEMBRO
const defaultHealthNoteItems: HealthNoteItem[] = [
  {
    id: 'hn-1',
    memberId: 'p2',
    memberName: 'Bryan',
    title: 'Medições dos 6 anos (Última consulta)',
    category: 'medicao',
    date: '2026-10-15',
    content: 'Bryan apresentou crescimento excelente, peso e altura no percentil 65.',
    metrics: [
      { label: 'Peso', value: '21.4 kg' },
      { label: 'Altura', value: '116 cm' }
    ]
  },
  {
    id: 'hn-2',
    memberId: 'p3',
    memberName: 'Benício',
    title: 'Medições dos 3 anos e dentes de leite',
    category: 'medicao',
    date: '2026-10-20',
    content: 'Todos os 20 dentinhos nascidos, sem cáries. Muito ativo e com ótimo apetite.',
    metrics: [
      { label: 'Peso', value: '14.8 kg' },
      { label: 'Altura', value: '95 cm' }
    ]
  },
  {
    id: 'hn-3',
    memberId: 'p1',
    memberName: 'Brenda',
    title: 'Histórico de Alergias e Cuidados com a Pele',
    category: 'alergia',
    date: '2026-09-10',
    content: 'Alergia leve a frutos do mar (camarão). Reação alérgica a produtos com sulfatos fortes no rosto.',
    metrics: [
      { label: 'Pressão média', value: '11/7' },
      { label: 'Tipo sanguíneo', value: 'O+' }
    ]
  }
];

const defaultHealthGroups: HealthGroup[] = [
  { id: 'hg-1', name: 'Suplementação Diária', icon: '💊', color: '#8C7A6B' },
  { id: 'hg-2', name: 'Pediatria dos Filhos', icon: '👶', color: '#2563EB' },
  { id: 'hg-3', name: 'Exames & Prazos Periódicos', icon: '🔬', color: '#059669' }
];

// METAS MODULE - CATEGORIAS & METAS (Prazo específico ou Contagem regressiva)
const defaultGoalCategories: GoalCategory[] = [
  { id: 'gcat-casa', name: 'Casa & Reforma', icon: '🏡', color: '#8C7A6B' },
  { id: 'gcat-familia', name: 'Família & Filhos', icon: '👨‍👩‍👧‍👦', color: '#D97706' },
  { id: 'gcat-saude', name: 'Saúde & Autocuidado', icon: '🌿', color: '#059669' },
  { id: 'gcat-financas', name: 'Finanças & Poupança', icon: '💰', color: '#2563EB' }
];

const defaultGoals: GoalItem[] = [
  {
    id: 'g-1',
    title: 'Pintar o quarto das crianças',
    categoryId: 'gcat-casa',
    category: 'Casa & Reforma',
    progressPercent: 40,
    totalSteps: 3,
    completedSteps: 1,
    status: 'em_andamento',
    deadlineType: 'data_especifica',
    dueDate: '2026-11-25',
    steps: [
      { id: 's1', text: 'Escolher a cor suave com as crianças', done: true },
      { id: 's2', text: 'Comprar material e fitas protetoras', done: false },
      { id: 's3', text: 'Pintar e organizar a nova decoração', done: false }
    ]
  },
  {
    id: 'g-2',
    title: 'Comprar roupas das crianças para o calor',
    categoryId: 'gcat-familia',
    category: 'Família & Filhos',
    progressPercent: 100,
    totalSteps: 2,
    completedSteps: 2,
    status: 'concluida',
    deadlineType: 'data_especifica',
    dueDate: '2026-10-18',
    steps: [
      { id: 's4', text: 'Checar peças que não servem mais', done: true },
      { id: 's5', text: 'Comprar novos conjuntos confortáveis', done: true }
    ]
  },
  {
    id: 'g-3',
    title: 'Organizar armários e doações',
    categoryId: 'gcat-casa',
    category: 'Casa & Reforma',
    progressPercent: 25,
    totalSteps: 4,
    completedSteps: 1,
    status: 'em_andamento',
    deadlineType: 'contagem_dias',
    targetDays: 14, // Faltam 14 dias
    dueDate: '2026-11-20',
    steps: [
      { id: 's6', text: 'Separar descarte e doação', done: true },
      { id: 's7', text: 'Caixas organizadoras etiquetadas', done: false },
      { id: 's8', text: 'Roupas de cama e toalhas dobradas', done: false },
      { id: 's9', text: 'Gaveta de documentos em dia', done: false }
    ]
  }
];

// Default Recurring Tasks
const defaultRecurringTasks: RecurringTaskItem[] = [
  {
    id: 'rec-1',
    title: 'Calibrar pneu do carro/moto',
    recurrence: 'A cada 14 dias',
    nextDate: '04/11',
    status: 'pendente',
    icon: 'wrench',
    notes: 'Posto Shell perto da escola'
  },
  {
    id: 'rec-2',
    title: 'Lavar os sapatos e tênis das crianças',
    recurrence: 'Todo dia 15',
    nextDate: '15/11',
    status: 'hoje',
    icon: 'sparkles',
    notes: 'Sabão neutro e secar na sombra'
  },
  {
    id: 'rec-3',
    title: 'Trocar roupa de cama e toalhas',
    recurrence: 'Semanalmente às Sextas',
    nextDate: 'Sexta-feira',
    status: 'pendente',
    icon: 'bed',
    notes: 'Lençóis com cheirinho suave de lavanda'
  }
];

const defaultRecurringHistory: TaskExecutionRecord[] = [
  { id: 'th-1', taskId: 'rec-1', taskTitle: 'Calibrar pneu do carro/moto', displayDate: '17/10', completedAt: '2026-10-17T10:00:00Z' },
  { id: 'th-2', taskId: 'rec-3', taskTitle: 'Trocar roupa de cama e toalhas', displayDate: '10/10', completedAt: '2026-10-10T09:30:00Z' },
  { id: 'th-3', taskId: 'rec-2', taskTitle: 'Lavar os sapatos e tênis das crianças', displayDate: '03/10', completedAt: '2026-10-03T15:00:00Z' }
];

const defaultNotifications: AppNotification[] = [
  { id: 'n-1', title: 'Lembrete de autocuidado', message: 'Hoje é dia de esfoliação corporal durante o banho da noite!', time: 'Há 25 minutos', read: false, type: 'lembrete' },
  { id: 'n-2', title: 'Agenda de amanhã', message: 'Futebol das crianças agendado para Terça-feira às 17h.', time: 'Há 2 horas', read: false, type: 'familia' },
  { id: 'n-3', title: 'Evolução da semana', message: 'Seu mapa registrou 80% de momentos positivos. Continue assim! 💛', time: 'Ontem', read: true, type: 'rotina' }
];

// Personal data starts empty for every new account (no demo data)
const EMPTY_PERSONAL_STATE: Record<string, any> = {
  moodRecords: [],
  dayFactors: {},
  dayNotes: {},
  questionResponses: [],
  agendaItems: [],
  weeklyFixedTopics: [],
  routineTasks: [],
  dailyChronologicalSteps: [],
  healthDateItems: [],
  healthMedications: [],
  healthNoteItems: [],
  goals: [],
  recurringTasks: [],
  recurringHistory: [],
  notifications: []
};

const PENDING_NAME_KEY = 'rotina_ai_pending_display_name';

const firstNameFor = (user: { displayName?: string | null; email?: string | null }) => {
  let pending = '';
  try {
    pending = localStorage.getItem(PENDING_NAME_KEY) || '';
  } catch {
    // ignore
  }
  const raw = (pending || user.displayName || (user.email || '').split('@')[0] || 'Você').trim();
  const first = raw.split(/[\s._-]+/)[0] || raw;
  return first.charAt(0).toUpperCase() + first.slice(1);
};

// Initial state for a brand-new account: the user's own profile + default settings, no demo records
const buildStarterState = (user: { displayName?: string | null; email?: string | null }): Record<string, any> => ({
  ...EMPTY_PERSONAL_STATE,
  profiles: [
    {
      id: 'p1',
      name: firstNameFor(user),
      role: 'Eu',
      subtitle: 'Administrador(a) da Família',
      isPrimary: true,
      memberType: 'real',
      email: user.email || '',
      color: '#8C7A6B'
    }
  ],
  bottomNavSlots: defaultBottomNavSlots,
  notificationPreferences: defaultNotificationPreferences,
  moodOptions: defaultMoodOptions,
  availableFactors: defaultAvailableFactors,
  lifeAreas: defaultLifeAreas,
  questionGroups: defaultQuestionGroups,
  questions: defaultQuestions,
  agendaCategories: defaultAgendaCategories,
  healthGroups: defaultHealthGroups,
  goalCategories: defaultGoalCategories
});

// Writes a full app state into localStorage (the app boots from it after reload)
const writeLocalAppState = (state: Record<string, any>) => {
  Object.entries(CLOUD_SYNC_FIELDS).forEach(([field, suffix]) => {
    const key = `${STORAGE_KEY}_${suffix}`;
    if (state[field] !== undefined && state[field] !== null) {
      localStorage.setItem(key, JSON.stringify(state[field]));
    } else if (field in EMPTY_PERSONAL_STATE) {
      // Realtime Database does not store empty lists/objects
      localStorage.setItem(key, JSON.stringify(EMPTY_PERSONAL_STATE[field]));
    } else {
      localStorage.removeItem(key);
    }
  });
};

const clearLocalAppState = () => {
  Object.values(CLOUD_SYNC_FIELDS).forEach((suffix) => localStorage.removeItem(`${STORAGE_KEY}_${suffix}`));
  localStorage.removeItem(`${STORAGE_KEY}_owner_uid`);
  localStorage.removeItem(`${STORAGE_KEY}_user_email`);
  localStorage.removeItem(`${STORAGE_KEY}_is_logged_in`);
};

// Exemplos que vinham pré-carregados nas primeiras versões (usados só para reconhecê-los e retirá-los)
const DEMO_QUESTION_RESPONSES: QuestionResponse[] = [
        { id: 'qr-1', questionId: 'q-paciencia', date: '2026-11-16', choice: 'nao', value: 'positivo', updatedAt: '2026-11-16T10:00:00Z' },
        { id: 'qr-2', questionId: 'q-afeto', date: '2026-11-16', choice: 'sim', value: 'positivo', updatedAt: '2026-11-16T11:00:00Z' },
        { id: 'qr-3', questionId: 'q-sono-criancas', date: '2026-11-16', choice: 'sim', value: 'positivo', updatedAt: '2026-11-16T21:40:00Z' },
        { id: 'qr-4', questionId: 'q-tempo-para-mim', date: '2026-11-16', choice: 'sim', value: 'positivo', updatedAt: '2026-11-16T15:00:00Z' },
        { id: 'qr-5', questionId: 'q-sobrecarga', date: '2026-11-16', choice: 'sim', value: 'negativo', updatedAt: '2026-11-16T16:00:00Z' },
        { id: 'qr-6', questionId: 'q-pia-limpa', date: '2026-11-16', choice: 'sim', value: 'positivo', updatedAt: '2026-11-16T22:00:00Z' },
        { id: 'qr-7', questionId: 'q-agua', date: '2026-11-16', choice: 'nao_se_aplica', value: 'nao_se_aplica', updatedAt: '2026-11-16T22:00:00Z' }
      ];
const DEMO_MOOD_RECORDS: MoodRecord[] = [
        {
          id: 'mr-1',
          date: '2026-11-16',
          period: 'manha',
          mood: 'muito_bem',
          label: 'Muito Bem',
          intensity: 4,
          notes: 'Acordei com disposição e as crianças brincaram alegremente.',
          timestamp: '2026-11-16T08:30:00Z'
        },
        {
          id: 'mr-2',
          date: '2026-11-16',
          period: 'tarde',
          mood: 'bem',
          label: 'Bem',
          intensity: 3,
          notes: 'Almoço nutritivo e lição de casa tranquila.',
          timestamp: '2026-11-16T14:15:00Z'
        }
      ];
const DEMO_DAY_FACTORS: Record<string, string[]> = {
        '2026-11-16': ['dia_tranquilo', 'passeio'],
        '2026-11-15': ['sono_ruim', 'cansaco_fisico']
      };

export type DemoField =
  | 'routineTasks'
  | 'dailyChronologicalSteps'
  | 'agendaItems'
  | 'weeklyFixedTopics'
  | 'healthMedications'
  | 'healthDateItems'
  | 'healthNoteItems'
  | 'goals'
  | 'recurringTasks'
  | 'profiles';

export interface DemoCandidate {
  field: DemoField;
  id: string;
  label: string;
  group: string;
  unchanged: boolean; // igual ao exemplo original (provavelmente nunca usado)
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_profiles`);
      return saved ? JSON.parse(saved) : defaultProfiles;
    } catch {
      return defaultProfiles;
    }
  });

  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    return profiles[0]?.id || 'p1';
  });

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0] || defaultProfiles[0];

  const switchProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
  };

  const updateProfile = (id: string, updates: Partial<UserProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addProfile = (profile: Omit<UserProfile, 'id'>) => {
    const newId = `p-${Date.now()}`;
    const newProfile: UserProfile = { ...profile, id: newId };
    setProfiles((prev) => [...prev, newProfile]);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (currentProfileId === id) {
      setCurrentProfileId(profiles.find((p) => p.id !== id)?.id || 'p1');
    }
  };

  // Customizable Bottom Nav Slots
  const [bottomNavSlots, setBottomNavSlotsState] = useState<BottomNavSlot[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bottom_nav_slots`);
      return saved ? JSON.parse(saved) : defaultBottomNavSlots;
    } catch {
      return defaultBottomNavSlots;
    }
  });

  const [isCustomizingNavOpen, setIsCustomizingNavOpen] = useState(false);

  const setBottomNavSlots = (slots: BottomNavSlot[]) => {
    setBottomNavSlotsState(slots);
  };

  const resetBottomNavToDefault = () => {
    setBottomNavSlotsState(defaultBottomNavSlots);
  };

  // Color Palette & Typography Font Size State
  const [colorPalette, setColorPaletteState] = useState<ColorPalette>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_color_palette`);
      return (saved as ColorPalette) || 'original';
    } catch {
      return 'original';
    }
  });

  const [fontSizeScale, setFontSizeScaleState] = useState<FontSizeScale>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_font_scale`);
      return (saved as FontSizeScale) || 'normal';
    } catch {
      return 'normal';
    }
  });

  const setColorPalette = (palette: ColorPalette) => {
    setColorPaletteState(palette);
    try {
      localStorage.setItem(`${STORAGE_KEY}_color_palette`, palette);
    } catch {}
  };

  const setFontSizeScale = (scale: FontSizeScale) => {
    setFontSizeScaleState(scale);
    try {
      localStorage.setItem(`${STORAGE_KEY}_font_scale`, scale);
    } catch {}
  };

  useEffect(() => {
    if (colorPalette === 'original') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', colorPalette);
    }
  }, [colorPalette]);

  useEffect(() => {
    const scaleMap: Record<FontSizeScale, string> = {
      pequeno: '87.5%',
      normal: '100%',
      grande: '112.5%',
      extragrande: '125%'
    };
    document.documentElement.style.fontSize = scaleMap[fontSizeScale] || '100%';
  }, [fontSizeScale]);

  // Notification Preferences
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notif_prefs`);
      return saved ? JSON.parse(saved) : defaultNotificationPreferences;
    } catch {
      return defaultNotificationPreferences;
    }
  });

  const toggleNotificationPreference = (key: keyof NotificationPreferences) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateNotificationPreferences = (updates: Partial<NotificationPreferences>) => {
    setNotificationPreferences((prev) => ({ ...prev, ...updates }));
  };

  // Date Selection
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());

  // Real current day; keeps "Hoje" correct when the app stays open past midnight
  const [currentDay, setCurrentDay] = useState<string>(() => todayISO());
  useEffect(() => {
    let lastToday = todayISO();
    const timer = setInterval(() => {
      const now = todayISO();
      if (now !== lastToday) {
        setSelectedDate((prev) => (prev === lastToday ? now : prev));
        setCurrentDay(now);
        lastToday = now;
      }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily history of what was done (routines, steps, medications, agenda) used by the reports.
  // Only what the person marks is stored: a day without a mark is "sem registro", never "não fez".
  const [activityLog, setActivityLog] = useState<ActivityLog>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activity_log`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const logActivity = (kind: 'r' | 's' | 'a', id: string, status: ActivityStatus | null, date: string = currentDay) => {
    setActivityLog((prev) => {
      const days = { ...(prev.days || {}) };
      const day = { ...(days[date] || {}) };
      const bucket = { ...((day[kind] as Record<string, ActivityStatus>) || {}) };
      if (status) bucket[id] = status;
      else delete bucket[id];
      day[kind] = bucket;
      days[date] = day;
      return { since: prev.since || currentDay, days };
    });
  };

  const logMedication = (id: string, status: ActivityStatus | null, date: string = currentDay) => {
    setActivityLog((prev) => {
      const days = { ...(prev.days || {}) };
      const day = { ...(days[date] || {}) };
      const bucket = { ...(day.m || {}) };
      if (status) bucket[id] = { st: status, at: new Date().toISOString() };
      else delete bucket[id];
      day.m = bucket;
      days[date] = day;
      return { since: prev.since || currentDay, days };
    });
  };

  // Maintenance info (demo-data cleanup) synced with the account
  const [dataMaintenance, setDataMaintenance] = useState<DataMaintenance>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_data_maintenance`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Mood Options
  const [moodOptions, setMoodOptions] = useState<MoodOption[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_mood_options`);
      return saved ? JSON.parse(saved) : defaultMoodOptions;
    } catch {
      return defaultMoodOptions;
    }
  });

  const addMoodOption = (mood: Omit<MoodOption, 'id'>) => {
    const newId = `mopt-${Date.now()}`;
    setMoodOptions((prev) => [...prev, { ...mood, id: newId }]);
  };

  const updateMoodOption = (id: string, updates: Partial<MoodOption>) => {
    setMoodOptions((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMoodOption = (id: string) => {
    setMoodOptions((prev) => prev.filter((m) => m.id !== id));
  };

  // Mood Records
  const [moodRecords, setMoodRecords] = useState<MoodRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_mood_records`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const savePeriodMood = (record: Omit<MoodRecord, 'id' | 'timestamp'>) => {
    const newRecord: MoodRecord = {
      ...record,
      id: `mr-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setMoodRecords((prev) => [newRecord, ...prev.filter((r) => !(r.date === record.date && r.period === record.period))]);
  };

  // Latest mood registered for the selected day (none if nothing was registered that day)
  const currentMood =
    moodRecords
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0] || null;
  const moodEntries = moodRecords;

  const saveMoodEntry = (moodValue: string, note?: string) => {
    const matchedMood = moodOptions.find(
      (m) => m.id === moodValue || m.label.toLowerCase() === moodValue.toLowerCase()
    );
    savePeriodMood({
      date: selectedDate,
      period: 'noite',
      mood: matchedMood ? matchedMood.id : 'bem',
      label: matchedMood ? matchedMood.label : 'Bem',
      intensity: matchedMood ? matchedMood.intensity : 4,
      value: (matchedMood?.id || 'bem') as MoodValue,
      notes: note
    });
  };

  const deleteMoodRecord = (id: string) => {
    setMoodRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const getMoodRecordsForDate = (date: string) => {
    return moodRecords.filter((r) => r.date === date);
  };

  // Available Factors & Per-Day Selection
  const [availableFactors, setAvailableFactors] = useState<FactorOption[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_available_factors`);
      return saved ? JSON.parse(saved) : defaultAvailableFactors;
    } catch {
      return defaultAvailableFactors;
    }
  });

  const addCustomFactor = (label: string, icon: string = '✨') => {
    const newId = `factor-${Date.now()}`;
    setAvailableFactors((prev) => [...prev, { id: newId, label, icon, visible: true }]);
    return newId;
  };

  // Rename / new emoji: the day records keep pointing to the same factor (by id), so history is preserved
  const updateCustomFactor = (id: string, label: string, icon?: string) => {
    const old = availableFactors.find((f) => f.id === id);
    setAvailableFactors((prev) => prev.map((f) => (f.id === id ? { ...f, label, icon: icon || f.icon } : f)));
    // Older versions saved some day factors by their name: point them to the id before renaming
    if (old && old.label !== label) {
      setDayFactors((prev) => {
        let changed = false;
        const next: Record<string, string[]> = {};
        Object.entries(prev).forEach(([date, list]) => {
          const mapped = Array.from(new Set(list.map((x) => (x === old.label ? id : x))));
          if (mapped.length !== list.length || mapped.some((x, i) => x !== list[i])) changed = true;
          next[date] = mapped;
        });
        return changed ? next : prev;
      });
    }
  };

  const deleteCustomFactor = (id: string) => {
    setAvailableFactors((prev) => prev.filter((f) => f.id !== id));
  };

  const [dayFactors, setDayFactors] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_day_factors`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleDayFactor = (date: string, factorId: string) => {
    // Older versions saved some factors by name: treat name and id as the same factor
    const label = availableFactors.find((f) => f.id === factorId)?.label;
    setDayFactors((prev) => {
      const current = prev[date] || [];
      const isOn = current.includes(factorId) || (!!label && current.includes(label));
      const updated = isOn ? current.filter((f) => f !== factorId && f !== label) : [...current, factorId];
      return { ...prev, [date]: updated };
    });
  };

  // Day Notes
  const [dayNotes, setDayNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_day_notes`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const setDayNotesForDate = (date: string, notes: string) => {
    setDayNotes((prev) => ({ ...prev, [date]: notes }));
  };

  // Life Areas, Question Groups & Questions
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_life_areas`);
      return saved ? JSON.parse(saved) : defaultLifeAreas;
    } catch {
      return defaultLifeAreas;
    }
  });

  const createLifeArea = (name: string, icon: string = '📌') => {
    const newArea: LifeArea = {
      id: `area-${Date.now()}`,
      name,
      icon,
      order: lifeAreas.length + 1
    };
    setLifeAreas((prev) => [...prev, newArea]);
  };

  const updateLifeArea = (id: string, name: string, icon?: string) => {
    setLifeAreas((prev) => prev.map((a) => (a.id === id ? { ...a, name, icon: icon || a.icon } : a)));
  };

  const deleteLifeArea = (id: string) => {
    setLifeAreas((prev) => prev.filter((a) => a.id !== id));
    setQuestionGroups((prev) => prev.filter((g) => g.areaId !== id));
    setQuestions((prev) => prev.filter((q) => q.areaId !== id));
  };

  const reorderArea = (id: string, direction: 'up' | 'down') => {
    setLifeAreas((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_question_groups`);
      return saved ? JSON.parse(saved) : defaultQuestionGroups;
    } catch {
      return defaultQuestionGroups;
    }
  });

  const createQuestionGroup = (areaId: string, name: string) => {
    const newGroup: QuestionGroup = {
      id: `grp-${Date.now()}`,
      areaId,
      name,
      order: questionGroups.filter((g) => g.areaId === areaId).length + 1
    };
    setQuestionGroups((prev) => [...prev, newGroup]);
  };

  const updateQuestionGroup = (id: string, name: string) => {
    setQuestionGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const deleteQuestionGroup = (id: string) => {
    setQuestionGroups((prev) => prev.filter((g) => g.id !== id));
    setQuestions((prev) => prev.filter((q) => q.groupId !== id));
  };

  const reorderGroup = (id: string, direction: 'up' | 'down') => {
    setQuestionGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_questions`);
      return saved ? JSON.parse(saved) : defaultQuestions;
    } catch {
      return defaultQuestions;
    }
  });

  const createQuestion = (question: Omit<QuestionItem, 'id'>) => {
    const newId = `q-${Date.now()}`;
    setQuestions((prev) => [...prev, { ...question, id: newId }]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionItem>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setQuestionResponses((prev) => prev.filter((r) => r.questionId !== id));
  };

  const duplicateQuestion = (id: string) => {
    const target = questions.find((q) => q.id === id);
    if (!target) return;
    const duplicated: QuestionItem = {
      ...target,
      id: `q-${Date.now()}`,
      title: `${target.title} (Cópia)`
    };
    setQuestions((prev) => [...prev, duplicated]);
  };

  const reorderQuestion = (id: string, direction: 'up' | 'down') => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const addQuestionFromAi = (data: {
    areaName: string;
    groupName: string;
    title: string;
    habitType: 'bom' | 'ruim';
    positiveIf?: 'sim' | 'nao';
    frequency?: 'todos_os_dias';
  }): QuestionItem => {
    let area = lifeAreas.find((a) => a.name.toLowerCase().includes(data.areaName.toLowerCase()));
    if (!area) {
      area = {
        id: `area-${Date.now()}`,
        name: data.areaName,
        icon: '📌',
        order: lifeAreas.length + 1
      };
      setLifeAreas((prev) => [...prev, area!]);
    }

    let group = questionGroups.find((g) => g.name.toLowerCase().includes(data.groupName.toLowerCase()));
    if (!group) {
      group = {
        id: `grp-${Date.now()}`,
        areaId: area.id,
        name: data.groupName,
        order: questionGroups.length + 1
      };
      setQuestionGroups((prev) => [...prev, group!]);
    }

    const newQuestion: QuestionItem = {
      id: `q-${Date.now()}`,
      areaId: area.id,
      groupId: group.id,
      title: data.title,
      habitType: data.habitType,
      positiveIf: data.habitType === 'bom' ? 'sim' : 'nao',
      positiveLabel: data.habitType === 'bom' ? 'Sim (Positivo)' : 'Não gritei / Evitado',
      negativeLabel: data.habitType === 'bom' ? 'Não (Negativo)' : 'Sim (Negativo)',
      frequency: 'todos_os_dias',
      order: questions.length + 1
    };

    setQuestions((prev) => [...prev, newQuestion]);
    return newQuestion;
  };

  // Question Responses
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_question_responses`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const setQuestionResponse = (
    questionId: string,
    date: string,
    value: QuestionResponseValue,
    note?: string
  ) => {
    setQuestionResponses((prev) => {
      const filtered = prev.filter((r) => !(r.questionId === questionId && r.date === date));
      const newResponse: QuestionResponse = {
        id: `qr-${Date.now()}`,
        questionId,
        date,
        value,
        note,
        updatedAt: new Date().toISOString()
      };
      return [...filtered, newResponse];
    });
  };

  const recordChoiceResponse = (
    questionId: string,
    date: string,
    choice: QuestionChoice,
    note?: string
  ) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const value = resolveResponseValue(choice, question.positiveIf || 'sim');
    setQuestionResponses((prev) => {
      const filtered = prev.filter((r) => !(r.questionId === questionId && r.date === date));
      const newResponse: QuestionResponse = {
        id: `qr-${Date.now()}`,
        questionId,
        date,
        choice,
        value,
        note,
        updatedAt: new Date().toISOString()
      };
      return [...filtered, newResponse];
    });
  };

  const getQuestionResponse = (questionId: string, date: string) => {
    return questionResponses.find((r) => r.questionId === questionId && r.date === date);
  };

  // Agenda Items, Categories & Weekly Fixed Topics
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_agenda_items`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addAgendaItem = (item: Omit<AgendaItem, 'id' | 'completed'>) => {
    const newItem: AgendaItem = {
      ...item,
      id: `ag-${Date.now()}`,
      completed: false
    };
    setAgendaItems((prev) => [...prev, newItem]);
  };

  const updateAgendaItem = (id: string, updates: Partial<AgendaItem>) => {
    setAgendaItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const toggleAgendaItem = (id: string) => {
    const item = agendaItems.find((a) => a.id === id);
    if (item) logActivity('a', id, item.completed ? null : 'fez', item.isRecurring ? currentDay : item.date || currentDay);
    setAgendaItems((prev) => prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  const deleteAgendaItem = (id: string) => {
    setAgendaItems((prev) => prev.filter((a) => a.id !== id));
  };

  const [agendaCategories, setAgendaCategories] = useState<AgendaCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_agenda_categories`);
      return saved ? JSON.parse(saved) : defaultAgendaCategories;
    } catch {
      return defaultAgendaCategories;
    }
  });

  const addAgendaCategory = (cat: Omit<AgendaCategory, 'id'>) => {
    const newId = `cat-${Date.now()}`;
    setAgendaCategories((prev) => [...prev, { ...cat, id: newId }]);
  };

  const updateAgendaCategory = (id: string, updates: Partial<AgendaCategory>) => {
    setAgendaCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteAgendaCategory = (id: string) => {
    setAgendaCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const [weeklyFixedTopics, setWeeklyFixedTopics] = useState<WeeklyFixedTopic[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_weekly_topics`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addWeeklyFixedTopic = (topic: Omit<WeeklyFixedTopic, 'id'>) => {
    const newId = `wft-${Date.now()}`;
    setWeeklyFixedTopics((prev) => [...prev, { ...topic, id: newId }]);
  };

  const updateWeeklyFixedTopic = (id: string, updates: Partial<WeeklyFixedTopic>) => {
    setWeeklyFixedTopics((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteWeeklyFixedTopic = (id: string) => {
    setWeeklyFixedTopics((prev) => prev.filter((t) => t.id !== id));
  };

  // Routine Tasks
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_routine_tasks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Routines repeat every day: a task only counts as done on the day it was checked
  const routineTasksToday = React.useMemo(
    () => routineTasks.map((t) => ({ ...t, completed: !!t.completed && t.completedOn === currentDay })),
    [routineTasks, currentDay]
  );

  const toggleRoutineTask = (id: string) => {
    const task = routineTasks.find((t) => t.id === id);
    const wasDone = !!task && !!task.completed && task.completedOn === currentDay;
    logActivity('r', id, wasDone ? null : 'fez');
    setRoutineTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const doneToday = !!t.completed && t.completedOn === currentDay;
        return doneToday
          ? { ...t, completed: false, completedOn: undefined, statusHistory: 'pendente' }
          : { ...t, completed: true, completedOn: currentDay, statusHistory: 'fez' };
      })
    );
  };

  const addRoutineTask = (task: Omit<RoutineTask, 'id' | 'completed'>) => {
    const newTask: RoutineTask = {
      ...task,
      id: `rt-${Date.now()}`,
      completed: false
    };
    setRoutineTasks((prev) => [...prev, newTask]);
  };

  const updateRoutineTask = (id: string, updates: Partial<RoutineTask>) => {
    setRoutineTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteRoutineTask = (id: string) => {
    setRoutineTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const [activePeriodModal, setActivePeriodModal] = useState<PeriodKey | null>(null);

  // Daily Chronological Steps (Passo a passo com voz)
  const [dailyChronologicalSteps, setDailyChronologicalSteps] = useState<DailyChronologicalStep[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_daily_chrono_steps`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dailyChronologicalStepsToday = React.useMemo(
    () => dailyChronologicalSteps.map((s) => ({ ...s, completed: !!s.completed && s.completedOn === currentDay })),
    [dailyChronologicalSteps, currentDay]
  );

  const toggleDailyChronologicalStep = (id: string) => {
    const step = dailyChronologicalSteps.find((x) => x.id === id);
    const wasDone = !!step && !!step.completed && step.completedOn === currentDay;
    logActivity('s', id, wasDone ? null : 'fez');
    setDailyChronologicalSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const doneToday = !!s.completed && s.completedOn === currentDay;
        return doneToday ? { ...s, completed: false, completedOn: undefined } : { ...s, completed: true, completedOn: currentDay };
      })
    );
  };

  const addDailyChronologicalStep = (step: Omit<DailyChronologicalStep, 'id' | 'completed'>) => {
    const newStep: DailyChronologicalStep = {
      ...step,
      id: `dcs-${Date.now()}`,
      completed: false
    };
    setDailyChronologicalSteps((prev) => [...prev, newStep]);
  };

  const updateDailyChronologicalStep = (id: string, updates: Partial<DailyChronologicalStep>) => {
    setDailyChronologicalSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteDailyChronologicalStep = (id: string) => {
    setDailyChronologicalSteps((prev) => prev.filter((s) => s.id !== id));
  };

  // Voice reminder with the voice, speed and pitch chosen in Configurações > Sons e voz
  const speakVoiceReminder = React.useCallback(
    (text: string) => {
      speakText(text, {
        voiceName: notificationPreferences.voiceName,
        nativeVoiceName: notificationPreferences.nativeVoiceName,
        voiceRate: notificationPreferences.voiceRate,
        voicePitch: notificationPreferences.voicePitch
      });
    },
    [
      notificationPreferences.voiceName,
      notificationPreferences.nativeVoiceName,
      notificationPreferences.voiceRate,
      notificationPreferences.voicePitch
    ]
  );

  // Contextual Reminders
  // Contextual reminders (no demo reminder)
  const [contextualReminders, setContextualReminders] = useState<ContextualReminder[]>([]);

  const dismissContextualReminder = (id: string) => {
    setContextualReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // SAÚDE MODULE (3 Abas: Datas, Medicamentos, Anotações)
  const [healthDateItems, setHealthDateItems] = useState<HealthDateItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_health_dates`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addHealthDateItem = (item: Omit<HealthDateItem, 'id' | 'completed'>) => {
    const newItem: HealthDateItem = { ...item, id: `hd-${Date.now()}`, completed: false };
    setHealthDateItems((prev) => [...prev, newItem]);
  };

  const updateHealthDateItem = (id: string, updates: Partial<HealthDateItem>) => {
    setHealthDateItems((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteHealthDateItem = (id: string) => {
    setHealthDateItems((prev) => prev.filter((d) => d.id !== id));
  };

  const toggleHealthDateItem = (id: string) => {
    setHealthDateItems((prev) => prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d)));
  };

  const [healthMedications, setHealthMedications] = useState<HealthMedication[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_health_meds`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addHealthMedication = (item: Omit<HealthMedication, 'id' | 'confirmed'>) => {
    const newItem: HealthMedication = { ...item, id: `hm-${Date.now()}`, confirmed: false, status: 'pendente' };
    setHealthMedications((prev) => [...prev, newItem]);
  };

  const updateHealthMedication = (id: string, updates: Partial<HealthMedication>) => {
    setHealthMedications((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteHealthMedication = (id: string) => {
    setHealthMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleHealthMedication = (id: string) => {
    const med = healthMedications.find((m) => m.id === id);
    const confirmedToday = !!med && !!med.confirmed && med.statusOn === currentDay;
    logMedication(id, confirmedToday ? null : 'fez');
    setHealthMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, confirmed: !confirmedToday, status: !confirmedToday ? 'fez' : 'pendente', statusOn: currentDay }
          : m
      )
    );
  };

  const setMedicationStatus = (id: string, status: 'pendente' | 'viu' | 'fez' | 'adiado', snoozeMinutes?: number) => {
    // "viu" never overwrites a dose already marked as taken today
    const med = healthMedications.find((m) => m.id === id);
    const takenToday = !!med && med.status === 'fez' && med.statusOn === currentDay;
    if (!(status === 'viu' && takenToday)) logMedication(id, status === 'pendente' ? null : status);
    setHealthMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const snoozedUntil = snoozeMinutes
          ? new Date(Date.now() + snoozeMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : undefined;
        if (status === 'viu' && m.status === 'fez' && m.statusOn === currentDay) return m;
        return {
          ...m,
          status,
          confirmed: status === 'fez',
          snoozedUntil,
          statusOn: currentDay
        };
      })
    );
  };

  const [healthNoteItems, setHealthNoteItems] = useState<HealthNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_health_notes`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addHealthNoteItem = (item: Omit<HealthNoteItem, 'id'>) => {
    const newItem: HealthNoteItem = { ...item, id: `hn-${Date.now()}` };
    setHealthNoteItems((prev) => [...prev, newItem]);
  };

  const updateHealthNoteItem = (id: string, updates: Partial<HealthNoteItem>) => {
    setHealthNoteItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteHealthNoteItem = (id: string) => {
    setHealthNoteItems((prev) => prev.filter((n) => n.id !== id));
  };

  const [selectedHealthMemberId, setSelectedHealthMemberId] = useState<string>('todos');

  const [healthGroups, setHealthGroups] = useState<HealthGroup[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_health_groups`);
      return saved ? JSON.parse(saved) : defaultHealthGroups;
    } catch {
      return defaultHealthGroups;
    }
  });

  const addHealthGroup = (group: Omit<HealthGroup, 'id'>) => {
    const newId = `hg-${Date.now()}`;
    setHealthGroups((prev) => [...prev, { ...group, id: newId }]);
  };

  const updateHealthGroup = (id: string, updates: Partial<HealthGroup>) => {
    setHealthGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteHealthGroup = (id: string) => {
    setHealthGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // Doses repeat every day: a status only counts on the day it was given
  const healthMedicationsToday = React.useMemo(
    () =>
      healthMedications.map((m) =>
        m.statusOn === currentDay
          ? m
          : { ...m, status: 'pendente' as const, confirmed: false, snoozedUntil: undefined }
      ),
    [healthMedications, currentDay]
  );

  // Backwards compatibility aliases for Cuidados
  const healthItems = healthMedicationsToday;
  const toggleHealthItem = toggleHealthMedication;
  const addHealthItem = addHealthMedication;
  const deleteHealthItem = deleteHealthMedication;

  // METAS MODULE (Com categorias e prazo específico ou contagem regressiva)
  const [goalCategories, setGoalCategories] = useState<GoalCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_goal_categories`);
      return saved ? JSON.parse(saved) : defaultGoalCategories;
    } catch {
      return defaultGoalCategories;
    }
  });

  const addGoalCategory = (cat: Omit<GoalCategory, 'id'>) => {
    const newId = `gcat-${Date.now()}`;
    setGoalCategories((prev) => [...prev, { ...cat, id: newId }]);
  };

  const updateGoalCategory = (id: string, updates: Partial<GoalCategory>) => {
    setGoalCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteGoalCategory = (id: string) => {
    setGoalCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const [goals, setGoals] = useState<GoalItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleGoalStep = (goalId: string, stepId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedSteps = g.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
        const completedCount = updatedSteps.filter((s) => s.done).length;
        const progress = Math.round((completedCount / updatedSteps.length) * 100);
        return {
          ...g,
          steps: updatedSteps,
          completedSteps: completedCount,
          progressPercent: progress,
          status: progress >= 100 ? 'concluida' : 'em_andamento'
        };
      })
    );
  };

  const addGoal = (goal: Omit<GoalItem, 'id' | 'progressPercent' | 'completedSteps' | 'totalSteps'>) => {
    const completedCount = goal.steps.filter((s) => s.done).length;
    const progress = goal.steps.length > 0 ? Math.round((completedCount / goal.steps.length) * 100) : 0;
    const newGoal: GoalItem = {
      ...goal,
      id: `g-${Date.now()}`,
      progressPercent: progress,
      completedSteps: completedCount,
      totalSteps: goal.steps.length
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<GoalItem>) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const merged = { ...g, ...updates };
        if (updates.steps) {
          const completedCount = merged.steps.filter((s) => s.done).length;
          merged.completedSteps = completedCount;
          merged.totalSteps = merged.steps.length;
          merged.progressPercent = merged.steps.length > 0 ? Math.round((completedCount / merged.steps.length) * 100) : 0;
          merged.status = merged.progressPercent >= 100 ? 'concluida' : 'em_andamento';
        }
        return merged;
      })
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Recurring Tasks
  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_recurring_tasks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recurringHistory, setRecurringHistory] = useState<TaskExecutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_recurring_history`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const completeRecurringTask = (id: string) => {
    const task = recurringTasks.find((t) => t.id === id);
    if (!task) return;
    const execution: TaskExecutionRecord = {
      id: `th-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      displayDate: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      completedAt: new Date().toISOString()
    };
    setRecurringHistory((prev) => [execution, ...prev]);
    setRecurringTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'concluido', nextDate: 'Concluído hoje' } : t))
    );
  };

  const addRecurringTask = (task: Omit<RecurringTaskItem, 'id' | 'status'>) => {
    const newTask: RecurringTaskItem = { ...task, id: `rec-${Date.now()}`, status: 'pendente' };
    setRecurringTasks((prev) => [...prev, newTask]);
  };

  const updateRecurringTask = (id: string, updates: Partial<RecurringTaskItem>) => {
    setRecurringTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteRecurringTask = (id: string) => {
    setRecurringTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const addAppNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'time'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `n-${Date.now()}`,
      read: false,
      time: 'Agora'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Global Interactive Alarm State (Balão + Alarme)
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPayload | null>(null);

  // The balloon (AlarmBalloonModal) speaks the reminder; here only the chime
  const triggerAlarm = (payload: ActiveAlarmPayload) => {
    setActiveAlarm({
      ...payload,
      voice: payload.voice !== false && notificationPreferences.voiceAlerts !== false
    });
    if (notificationPreferences.soundAlerts !== false) playWebSound(notificationPreferences.alarmSound || 'padrao');
  };

  const dismissAlarm = () => {
    setActiveAlarm(null);
  };

  const confirmAlarmAction = (action: 'viu' | 'fez' | 'adiar', snoozeMinutes: number = 15) => {
    if (!activeAlarm) return;
    if (activeAlarm.type === 'medicamento') {
      setMedicationStatus(activeAlarm.id, action === 'fez' ? 'fez' : action === 'viu' ? 'viu' : 'adiado', snoozeMinutes);
    } else if (activeAlarm.type === 'rotina') {
      const kind = (activeAlarm.key || '').split(':')[0];
      if (action === 'fez') {
        if (kind === 'etapa') toggleDailyChronologicalStep(activeAlarm.id);
        else if (kind !== 'recorrente') toggleRoutineTask(activeAlarm.id);
      } else if (action === 'viu' && kind !== 'etapa' && kind !== 'recorrente') {
        const t = routineTasks.find((x) => x.id === activeAlarm.id);
        if (!(t && t.completed && t.completedOn === currentDay)) logActivity('r', activeAlarm.id, 'viu');
        setRoutineTasks((prev) => prev.map((t) => (t.id === activeAlarm.id ? { ...t, statusHistory: 'viu' } : t)));
      } else if (action === 'adiar' && kind !== 'etapa' && kind !== 'recorrente') {
        const t = routineTasks.find((x) => x.id === activeAlarm.id);
        if (!(t && t.completed && t.completedOn === currentDay)) logActivity('r', activeAlarm.id, 'adiado');
      }
    } else if (activeAlarm.type === 'agenda') {
      if (action === 'fez') {
        toggleAgendaItem(activeAlarm.id);
      }
    }
    // "Adiar": the scheduler shows this reminder again after the chosen minutes
    if (action === 'adiar' && activeAlarm.key) {
      try {
        const snoozes = JSON.parse(localStorage.getItem('rotina_ai_alarms_snooze') || '{}');
        snoozes[activeAlarm.key] = Date.now() + snoozeMinutes * 60 * 1000;
        localStorage.setItem('rotina_ai_alarms_snooze', JSON.stringify(snoozes));
      } catch {
        // ignore
      }
    }
    setActiveAlarm(null);
  };

  // Modals & Navigation
  const [isManageQuestionsModalOpen, setIsManageQuestionsModalOpen] = useState(false);
  const [isRelatoriosModalOpen, setIsRelatoriosModalOpen] = useState(false);
  const [isMaisDrawerOpen, setIsMaisDrawerOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [activeTab, setActiveTabState] = useState<NavTab>('inicio');

  const setActiveTab = (tab: NavTab) => {
    // Map backwards compatibility
    if (tab === 'cuidados') {
      setActiveTabState('saude');
    } else {
      setActiveTabState(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // User Auth State & Firebase Realtime Database Sync
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_user_email`) || '';
  });

  // Nothing is shown until Firebase Auth answers; without a user the login screen is shown
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Cloud sync only starts after the user's data was read from Realtime Database,
  // so local data never overwrites what is already saved in the cloud.
  const [cloudSyncReady, setCloudSyncReady] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCloudSyncReady(false);
        setIsLoggedIn(false);
        setAuthReady(true);
        return;
      }

      setAuthReady(false);
      setUserEmail(user.email || '');
      localStorage.setItem(`${STORAGE_KEY}_user_email`, user.email || '');
      localStorage.setItem(`${STORAGE_KEY}_is_logged_in`, 'true');

      const ownerKey = `${STORAGE_KEY}_owner_uid`;
      const hydratedFlag = `${STORAGE_KEY}_rtdb_hydrated_${user.uid}`;
      const localBelongsToUser = localStorage.getItem(ownerKey) === user.uid;
      const remote = await loadUserRealtimeData(user.uid);

      // Loads `state` into local storage and restarts the app with it (once per session)
      const bootWith = (state: Record<string, any>) => {
        try {
          writeLocalAppState(state);
          localStorage.setItem(ownerKey, user.uid);
          localStorage.removeItem(PENDING_NAME_KEY);
          sessionStorage.setItem(hydratedFlag, '1');
          window.location.reload();
          return true;
        } catch {
          return false;
        }
      };

      if (remote === undefined) {
        // Cloud unreachable (offline): never show another account's local data
        if (!localBelongsToUser && bootWith(buildStarterState(user))) return;
        setIsLoggedIn(true);
        setAuthReady(true);
        return;
      }

      if (!localBelongsToUser || !sessionStorage.getItem(hydratedFlag)) {
        // Cloud copy wins on a new session; a brand-new account starts clean with its own name
        // Accounts created by the previous version saved the demo data ("Brenda") to the cloud: start them clean
        const demoEmail = defaultProfiles[0]?.email;
        const isDemoCopy =
          !!remote &&
          Array.isArray(remote.profiles) &&
          remote.profiles[0]?.email === demoEmail &&
          (user.email || '').toLowerCase() !== (demoEmail || '').toLowerCase();
        if (bootWith(remote && !isDemoCopy ? remote : buildStarterState(user))) return;
      }

      setIsLoggedIn(true);
      setCloudSyncReady(true);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const login = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    localStorage.setItem(`${STORAGE_KEY}_user_email`, email);
    localStorage.setItem(`${STORAGE_KEY}_is_logged_in`, 'true');
  };

  const logout = async () => {
    setCloudSyncReady(false);
    await logoutFirebase();
    try {
      clearLocalAppState();
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(`${STORAGE_KEY}_rtdb_hydrated_`))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // ignore
    }
    setUserEmail('');
    setIsLoggedIn(false);
    window.location.reload();
  };


  // ------------------------------------------------------------------
  // Dados de exemplo (demonstração) das primeiras versões do app
  // ------------------------------------------------------------------
  // 1) Registros claramente fictícios (respostas, humores, fatores e históricos de exemplo, com os
  //    mesmos identificadores e conteúdos dos exemplos) são retirados automaticamente uma única vez,
  //    com cópia guardada para poder desfazer.
  // 2) Cadastros de exemplo (rotinas, agenda, remédios, metas...) podem ter sido adotados pela pessoa:
  //    nunca são apagados sozinhos; aparecem em Configurações para ela revisar.
  const DEMO_RECORDS = React.useMemo(
    () => ({
      questionResponses: DEMO_QUESTION_RESPONSES,
      moodRecords: DEMO_MOOD_RECORDS,
      recurringHistory: defaultRecurringHistory,
      notifications: defaultNotifications
    }),
    []
  );

  useEffect(() => {
    if (!cloudSyncReady) return;
    // First day of the activity history + keeps today's marks made before this version
    if (!activityLog.since) {
      setActivityLog((prev) => {
        const day: any = { ...((prev.days || {})[currentDay] || {}) };
        const r: Record<string, ActivityStatus> = { ...(day.r || {}) };
        routineTasks.forEach((t) => {
          if (t.completed && t.completedOn === currentDay) r[t.id] = 'fez';
        });
        const st: Record<string, ActivityStatus> = { ...(day.s || {}) };
        dailyChronologicalSteps.forEach((x) => {
          if (x.completed && x.completedOn === currentDay) st[x.id] = 'fez';
        });
        return { since: currentDay, days: { ...(prev.days || {}), [currentDay]: { ...day, r, s: st } } };
      });
    }
    if ((dataMaintenance.demoCleanupVersion || 0) >= 1) return;

    const sameAs = (a: any, b: any, keys: string[]) => keys.every((k) => JSON.stringify(a?.[k]) === JSON.stringify(b?.[k]));
    const removed: Record<string, any[]> = {};
    const take = <T extends { id: string }>(field: string, list: T[], demo: T[], keys: string[]) => {
      const out: T[] = [];
      const gone: T[] = [];
      list.forEach((item) => {
        const d = demo.find((x) => x.id === item.id);
        if (d && sameAs(item, d, keys)) gone.push(item);
        else out.push(item);
      });
      if (gone.length) removed[field] = gone;
      return { out, changed: gone.length > 0 };
    };

    const qr = take('questionResponses', questionResponses, DEMO_RECORDS.questionResponses, ['questionId', 'date', 'value']);
    const mr = take('moodRecords', moodRecords, DEMO_RECORDS.moodRecords, ['date', 'mood', 'period']);
    const rh = take('recurringHistory', recurringHistory, DEMO_RECORDS.recurringHistory, ['taskId', 'completedAt']);
    const nt = take('notifications', notifications, DEMO_RECORDS.notifications, ['title', 'message']);

    const df = { ...dayFactors };
    const dfGone: any[] = [];
    Object.entries(DEMO_DAY_FACTORS).forEach(([date, list]) => {
      if (JSON.stringify(df[date] || []) === JSON.stringify(list)) {
        dfGone.push({ id: date, date, factors: list });
        delete df[date];
      }
    });
    if (dfGone.length) removed.dayFactors = dfGone;

    if (qr.changed) setQuestionResponses(qr.out);
    if (mr.changed) setMoodRecords(mr.out);
    if (rh.changed) setRecurringHistory(rh.out);
    if (nt.changed) setNotifications(nt.out);
    if (dfGone.length) setDayFactors(df);
    setDataMaintenance((prev) => ({
      ...prev,
      demoCleanupVersion: 1,
      demoCleanupAt: new Date().toISOString(),
      demoRemoved: Object.keys(removed).length ? { ...(prev.demoRemoved || {}), ...removed } : prev.demoRemoved
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudSyncReady]);

  // Cadastros que vieram como exemplo e continuam no app (para revisão em Configurações)
  const demoCandidates = React.useMemo(() => {
    const kept = new Set(dataMaintenance.demoKept || []);
    const out: DemoCandidate[] = [];
    const check = (field: DemoField, list: any[], demo: any[], label: (x: any) => string, keys: string[], group: string) => {
      list.forEach((item) => {
        const d = demo.find((x) => x.id === item.id);
        if (!d || kept.has(`${field}:${item.id}`)) return;
        out.push({ field, id: item.id, label: label(item), group, unchanged: keys.every((k) => JSON.stringify(item[k]) === JSON.stringify(d[k])) });
      });
    };
    check('routineTasks', routineTasks, defaultRoutineTasks, (x) => x.title, ['title', 'time', 'period'], 'Rotinas');
    check('dailyChronologicalSteps', dailyChronologicalSteps, defaultDailyChronologicalSteps, (x) => `${x.time} ${x.title}`, ['title', 'time'], 'Rotina diária (passo a passo)');
    check('agendaItems', agendaItems, defaultAgendaItems, (x) => x.title, ['title', 'date', 'time'], 'Agenda');
    check('weeklyFixedTopics', weeklyFixedTopics, defaultWeeklyFixedTopics, (x) => `${x.dayName}: ${x.title}`, ['title', 'dayOfWeek'], 'Agenda (fixos da semana)');
    check('healthMedications', healthMedications, defaultHealthMedications, (x) => `${x.name} (${x.memberName})`, ['name', 'time', 'memberName'], 'Medicamentos e suplementos');
    check('healthDateItems', healthDateItems, defaultHealthDateItems, (x) => `${x.title} (${x.memberName})`, ['title', 'date'], 'Consultas e exames');
    check('healthNoteItems', healthNoteItems, defaultHealthNoteItems, (x) => `${x.title} (${x.memberName})`, ['title', 'content'], 'Anotações de saúde');
    check('goals', goals, defaultGoals, (x) => x.title, ['title', 'dueDate'], 'Metas');
    check('recurringTasks', recurringTasks, defaultRecurringTasks, (x) => x.title, ['title', 'recurrence'], 'Tarefas recorrentes');
    check('profiles', profiles.filter((p) => !p.isPrimary), defaultProfiles.filter((p) => !p.isPrimary), (x) => `${x.name} (${x.role})`, ['name', 'role', 'email'], 'Membros da família');
    return out;
  }, [dataMaintenance.demoKept, routineTasks, dailyChronologicalSteps, agendaItems, weeklyFixedTopics, healthMedications, healthDateItems, healthNoteItems, goals, recurringTasks, profiles]);

  const SETTERS: Record<DemoField, React.Dispatch<React.SetStateAction<any[]>>> = {
    routineTasks: setRoutineTasks as any,
    dailyChronologicalSteps: setDailyChronologicalSteps as any,
    agendaItems: setAgendaItems as any,
    weeklyFixedTopics: setWeeklyFixedTopics as any,
    healthMedications: setHealthMedications as any,
    healthDateItems: setHealthDateItems as any,
    healthNoteItems: setHealthNoteItems as any,
    goals: setGoals as any,
    recurringTasks: setRecurringTasks as any,
    profiles: setProfiles as any
  };
  const CURRENT: Record<DemoField, any[]> = {
    routineTasks,
    dailyChronologicalSteps,
    agendaItems,
    weeklyFixedTopics,
    healthMedications,
    healthDateItems,
    healthNoteItems,
    goals,
    recurringTasks,
    profiles
  };

  /** Removes the chosen example items (a copy is kept so it can be undone). */
  const removeDemoItems = (items: { field: DemoField; id: string }[]) => {
    const byField: Record<string, Set<string>> = {};
    items.forEach((i) => (byField[i.field] = byField[i.field] || new Set()).add(i.id));
    const removed: Record<string, any[]> = {};
    (Object.keys(byField) as DemoField[]).forEach((field) => {
      const ids = byField[field];
      removed[field] = CURRENT[field].filter((x) => ids.has(x.id));
      SETTERS[field]((prev: any[]) => prev.filter((x) => !ids.has(x.id)));
    });
    setDataMaintenance((prev) => {
      const backup = { ...(prev.demoRemoved || {}) };
      Object.entries(removed).forEach(([f, list]) => (backup[f] = [...(backup[f] || []), ...list]));
      return { ...prev, demoRemoved: backup };
    });
  };

  /** Marks example items as the person's own (they stop showing in the review). */
  const keepDemoItems = (items: { field: DemoField; id: string }[]) => {
    setDataMaintenance((prev) => ({
      ...prev,
      demoKept: Array.from(new Set([...(prev.demoKept || []), ...items.map((i) => `${i.field}:${i.id}`)]))
    }));
  };

  /** Puts back everything removed as example data. */
  const undoDemoCleanup = () => {
    const backup = dataMaintenance.demoRemoved || {};
    const restore = <T extends { id: string }>(list: T[] | undefined, setter: (fn: (prev: T[]) => T[]) => void) => {
      if (!list || !list.length) return;
      setter((prev) => [...prev, ...list.filter((x) => !prev.some((p) => p.id === x.id))]);
    };
    restore(backup.questionResponses, setQuestionResponses as any);
    restore(backup.moodRecords, setMoodRecords as any);
    restore(backup.recurringHistory, setRecurringHistory as any);
    restore(backup.notifications, setNotifications as any);
    if (backup.dayFactors?.length) {
      setDayFactors((prev) => {
        const next = { ...prev };
        backup.dayFactors.forEach((d: any) => {
          if (!next[d.date]) next[d.date] = d.factors;
        });
        return next;
      });
    }
    (Object.keys(SETTERS) as DemoField[]).forEach((f) => restore(backup[f], SETTERS[f] as any));
    setDataMaintenance((prev) => ({ ...prev, demoRemoved: {} }));
  };

  const demoRemovedCount = Object.values(dataMaintenance.demoRemoved || {}).reduce((n, l) => n + (l?.length || 0), 0);

  // Persist State to LocalStorage & Sync to Firebase Realtime Database
  useEffect(() => {
    const appStatePayload = {
      profiles,
      bottomNavSlots,
      notificationPreferences,
      moodOptions,
      moodRecords,
      availableFactors,
      dayFactors,
      dayNotes,
      lifeAreas,
      questionGroups,
      questions,
      questionResponses,
      agendaItems,
      agendaCategories,
      weeklyFixedTopics,
      routineTasks,
      dailyChronologicalSteps,
      healthDateItems,
      healthMedications,
      healthNoteItems,
      healthGroups,
      goals,
      goalCategories,
      recurringTasks,
      recurringHistory,
      notifications,
      activityLog,
      dataMaintenance
    };

    try {
      localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(profiles));
      localStorage.setItem(`${STORAGE_KEY}_bottom_nav_slots`, JSON.stringify(bottomNavSlots));
      localStorage.setItem(`${STORAGE_KEY}_notif_prefs`, JSON.stringify(notificationPreferences));
      localStorage.setItem(`${STORAGE_KEY}_mood_options`, JSON.stringify(moodOptions));
      localStorage.setItem(`${STORAGE_KEY}_mood_records`, JSON.stringify(moodRecords));
      localStorage.setItem(`${STORAGE_KEY}_available_factors`, JSON.stringify(availableFactors));
      localStorage.setItem(`${STORAGE_KEY}_day_factors`, JSON.stringify(dayFactors));
      localStorage.setItem(`${STORAGE_KEY}_day_notes`, JSON.stringify(dayNotes));
      localStorage.setItem(`${STORAGE_KEY}_life_areas`, JSON.stringify(lifeAreas));
      localStorage.setItem(`${STORAGE_KEY}_question_groups`, JSON.stringify(questionGroups));
      localStorage.setItem(`${STORAGE_KEY}_questions`, JSON.stringify(questions));
      localStorage.setItem(`${STORAGE_KEY}_question_responses`, JSON.stringify(questionResponses));
      localStorage.setItem(`${STORAGE_KEY}_agenda_items`, JSON.stringify(agendaItems));
      localStorage.setItem(`${STORAGE_KEY}_agenda_categories`, JSON.stringify(agendaCategories));
      localStorage.setItem(`${STORAGE_KEY}_weekly_topics`, JSON.stringify(weeklyFixedTopics));
      localStorage.setItem(`${STORAGE_KEY}_routine_tasks`, JSON.stringify(routineTasks));
      localStorage.setItem(`${STORAGE_KEY}_daily_chrono_steps`, JSON.stringify(dailyChronologicalSteps));
      localStorage.setItem(`${STORAGE_KEY}_health_dates`, JSON.stringify(healthDateItems));
      localStorage.setItem(`${STORAGE_KEY}_health_meds`, JSON.stringify(healthMedications));
      localStorage.setItem(`${STORAGE_KEY}_health_notes`, JSON.stringify(healthNoteItems));
      localStorage.setItem(`${STORAGE_KEY}_health_groups`, JSON.stringify(healthGroups));
      localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(goals));
      localStorage.setItem(`${STORAGE_KEY}_goal_categories`, JSON.stringify(goalCategories));
      localStorage.setItem(`${STORAGE_KEY}_recurring_tasks`, JSON.stringify(recurringTasks));
      localStorage.setItem(`${STORAGE_KEY}_recurring_history`, JSON.stringify(recurringHistory));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${STORAGE_KEY}_activity_log`, JSON.stringify(activityLog));
      localStorage.setItem(`${STORAGE_KEY}_data_maintenance`, JSON.stringify(dataMaintenance));

      // If user is authenticated in Firebase, save to Realtime Database instance (app-rotinaai-default-rtdb)
      if (auth.currentUser && cloudSyncReady) {
        saveUserRealtimeData(auth.currentUser.uid, appStatePayload);
      }
    } catch {
      // Ignore quota errors
    }
  }, [
    profiles,
    bottomNavSlots,
    notificationPreferences,
    moodOptions,
    moodRecords,
    availableFactors,
    dayFactors,
    dayNotes,
    lifeAreas,
    questionGroups,
    questions,
    questionResponses,
    agendaItems,
    agendaCategories,
    weeklyFixedTopics,
    routineTasks,
    dailyChronologicalSteps,
    healthDateItems,
    healthMedications,
    healthNoteItems,
    healthGroups,
    goals,
    goalCategories,
    recurringTasks,
    recurringHistory,
    notifications,
    activityLog,
    dataMaintenance,
    cloudSyncReady
  ]);

  const exportAppData = (): string => {
    const data = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      profiles,
      bottomNavSlots,
      moodOptions,
      moodRecords,
      availableFactors,
      dayFactors,
      dayNotes,
      lifeAreas,
      questionGroups,
      questions,
      questionResponses,
      agendaItems,
      agendaCategories,
      weeklyFixedTopics,
      routineTasks,
      dailyChronologicalSteps,
      healthDateItems,
      healthMedications,
      healthNoteItems,
      healthGroups,
      goals,
      goalCategories,
      recurringTasks,
      recurringHistory,
      notifications,
      activityLog
    };
    return JSON.stringify(data, null, 2);
  };

  const importAppData = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.profiles) setProfiles(data.profiles);
      if (data.bottomNavSlots) setBottomNavSlotsState(data.bottomNavSlots);
      if (data.moodOptions) setMoodOptions(data.moodOptions);
      if (data.moodRecords) setMoodRecords(data.moodRecords);
      if (data.availableFactors) setAvailableFactors(data.availableFactors);
      if (data.dayFactors) setDayFactors(data.dayFactors);
      if (data.dayNotes) setDayNotes(data.dayNotes);
      if (data.lifeAreas) setLifeAreas(data.lifeAreas);
      if (data.questionGroups) setQuestionGroups(data.questionGroups);
      if (data.questions) setQuestions(data.questions);
      if (data.questionResponses) setQuestionResponses(data.questionResponses);
      if (data.agendaItems) setAgendaItems(data.agendaItems);
      if (data.agendaCategories) setAgendaCategories(data.agendaCategories);
      if (data.weeklyFixedTopics) setWeeklyFixedTopics(data.weeklyFixedTopics);
      if (data.routineTasks) setRoutineTasks(data.routineTasks);
      if (data.dailyChronologicalSteps) setDailyChronologicalSteps(data.dailyChronologicalSteps);
      if (data.healthDateItems) setHealthDateItems(data.healthDateItems);
      if (data.healthMedications) setHealthMedications(data.healthMedications);
      if (data.healthNoteItems) setHealthNoteItems(data.healthNoteItems);
      if (data.healthGroups) setHealthGroups(data.healthGroups);
      if (data.goals) setGoals(data.goals);
      if (data.goalCategories) setGoalCategories(data.goalCategories);
      if (data.recurringTasks) setRecurringTasks(data.recurringTasks);
      if (data.recurringHistory) setRecurringHistory(data.recurringHistory);
      if (data.moodRecords === undefined && data.moodEntries) setMoodRecords(data.moodEntries);
      if (data.activityLog) setActivityLog(data.activityLog);
      return true;
    } catch {
      return false;
    }
  };

  const resetAppToDefaults = () => {
    localStorage.clear();
    // Mantém só o próprio perfil; registros pessoais começam vazios (sem dados de exemplo)
    const own = profiles.filter((p) => p.isPrimary);
    setProfiles(own.length ? own : profiles.slice(0, 1));
    setBottomNavSlotsState(defaultBottomNavSlots);
    setMoodOptions(defaultMoodOptions);
    setAvailableFactors(defaultAvailableFactors);
    setDayFactors({});
    setDayNotes({});
    setMoodRecords([]);
    setQuestionResponses([]);
    setLifeAreas(defaultLifeAreas);
    setQuestionGroups(defaultQuestionGroups);
    setQuestions(defaultQuestions);
    setAgendaItems([]);
    setAgendaCategories(defaultAgendaCategories);
    setWeeklyFixedTopics([]);
    setRoutineTasks([]);
    setDailyChronologicalSteps([]);
    setHealthDateItems([]);
    setHealthMedications([]);
    setHealthNoteItems([]);
    setHealthGroups(defaultHealthGroups);
    setGoals([]);
    setGoalCategories(defaultGoalCategories);
    setRecurringTasks([]);
    setRecurringHistory([]);
    setNotifications([]);
    setActivityLog({ since: todayISO(), days: {} });
  };

  return (
    <AppContext.Provider
      value={{
        profiles,
        currentProfile,
        switchProfile,
        updateProfile,
        addProfile,
        deleteProfile,

        bottomNavSlots,
        setBottomNavSlots,
        isCustomizingNavOpen,
        setIsCustomizingNavOpen,
        resetBottomNavToDefault,

        colorPalette,
        setColorPalette,
        fontSizeScale,
        setFontSizeScale,

        notificationPreferences,
        toggleNotificationPreference,
        updateNotificationPreferences,
        activityLog,
        dataMaintenance,
        demoCandidates,
        demoRemovedCount,
        removeDemoItems,
        keepDemoItems,
        undoDemoCleanup,
        exportAppData,
        importAppData,
        resetAppToDefaults,

        selectedDate,
        setSelectedDate,

        moodOptions,
        addMoodOption,
        updateMoodOption,
        deleteMoodOption,

        moodRecords,
        moodEntries,
        currentMood,
        savePeriodMood,
        saveMoodEntry,
        deleteMoodRecord,
        getMoodRecordsForDate,

        availableFactors,
        addCustomFactor,
        updateCustomFactor,
        deleteCustomFactor,
        dayFactors,
        toggleDayFactor,

        dayNotes,
        setDayNotesForDate,

        lifeAreas,
        createLifeArea,
        updateLifeArea,
        deleteLifeArea,
        reorderArea,

        questionGroups,
        createQuestionGroup,
        updateQuestionGroup,
        deleteQuestionGroup,
        reorderGroup,

        questions,
        createQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        reorderQuestion,
        addQuestionFromAi,

        questionResponses,
        setQuestionResponse,
        recordChoiceResponse,
        getQuestionResponse,

        isManageQuestionsModalOpen,
        setIsManageQuestionsModalOpen,
        isRelatoriosModalOpen,
        setIsRelatoriosModalOpen,
        isMaisDrawerOpen,
        setIsMaisDrawerOpen,
        isAiChatOpen,
        setIsAiChatOpen,
        isMoodModalOpen,
        setIsMoodModalOpen,
        isAgendaModalOpen,
        setIsAgendaModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        activeTab,
        setActiveTab,

        activeAlarm,
        triggerAlarm,
        dismissAlarm,
        confirmAlarmAction,

        agendaItems,
        addAgendaItem,
        updateAgendaItem,
        toggleAgendaItem,
        deleteAgendaItem,
        agendaCategories,
        addAgendaCategory,
        updateAgendaCategory,
        deleteAgendaCategory,
        weeklyFixedTopics,
        addWeeklyFixedTopic,
        updateWeeklyFixedTopic,
        deleteWeeklyFixedTopic,

        routineTasks: routineTasksToday,
        toggleRoutineTask,
        addRoutineTask,
        updateRoutineTask,
        deleteRoutineTask,
        activePeriodModal,
        setActivePeriodModal,

        dailyChronologicalSteps: dailyChronologicalStepsToday,
        toggleDailyChronologicalStep,
        addDailyChronologicalStep,
        updateDailyChronologicalStep,
        deleteDailyChronologicalStep,
        speakVoiceReminder,

        contextualReminders,
        dismissContextualReminder,

        healthDateItems,
        addHealthDateItem,
        updateHealthDateItem,
        deleteHealthDateItem,
        toggleHealthDateItem,

        healthMedications: healthMedicationsToday,
        addHealthMedication,
        updateHealthMedication,
        deleteHealthMedication,
        toggleHealthMedication,
        setMedicationStatus,

        healthNoteItems,
        addHealthNoteItem,
        updateHealthNoteItem,
        deleteHealthNoteItem,

        selectedHealthMemberId,
        setSelectedHealthMemberId,

        healthGroups,
        addHealthGroup,
        updateHealthGroup,
        deleteHealthGroup,

        healthItems,
        toggleHealthItem,
        addHealthItem,
        deleteHealthItem,

        goals,
        goalCategories,
        addGoalCategory,
        updateGoalCategory,
        deleteGoalCategory,
        toggleGoalStep,
        addGoal,
        updateGoal,
        deleteGoal,

        recurringTasks,
        recurringHistory,
        completeRecurringTask,
        addRecurringTask,
        updateRecurringTask,
        deleteRecurringTask,

        notifications,
        markNotificationRead,
        addAppNotification,

        userEmail,
        isLoggedIn,
        authReady,
        login,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
