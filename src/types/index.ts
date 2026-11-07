export type PeriodKey = 'manha' | 'tarde' | 'noite' | 'especiais';

export type MemberType = 'real' | 'fantasma';

export type ColorPalette = 'original' | 'nude' | 'verde' | 'azul' | 'escuro';
export type FontSizeScale = 'pequeno' | 'normal' | 'grande' | 'extragrande';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  subtitle?: string;
  isPrimary?: boolean;
  memberType?: MemberType; // 'real' = pessoa com e-mail e login compartilhado; 'fantasma' = apenas nome de controle
  email?: string;
  familyCode?: string;
  color?: string;
}

export type DayPeriod = 'manha' | 'tarde' | 'noite' | 'personalizado';

export type MoodType =
  | 'muito_bem'
  | 'bem'
  | 'neutro'
  | 'triste'
  | 'irritado'
  | 'ansioso'
  | 'sobrecarregado';

export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  intensity: number; // 1 to 5
  visible: boolean;
}

export interface MoodRecord {
  id: string;
  date: string; // YYYY-MM-DD
  period: DayPeriod;
  customTime?: string;
  mood: string; // mood id or label
  label: string;
  intensity: number; // 1 to 5
  notes?: string;
  timestamp: string;
  value?: MoodValue;
  factors?: string[];
  positiveScore?: number;
}

export interface FactorOption {
  id: string;
  label: string;
  icon?: string;
  category?: 'fisico' | 'emocional' | 'familiar' | 'rotina';
  visible: boolean;
}

export type QuestionResponseValue =
  | 'positivo'
  | 'negativo'
  | 'nao_se_aplica'
  | 'nao_lembro';

export interface LifeArea {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
}

export interface QuestionGroup {
  id: string;
  areaId: string;
  name: string;
  order: number;
}

export interface QuestionItem {
  id: string;
  groupId: string;
  areaId: string;
  title: string;
  habitType: 'bom' | 'ruim'; // 'bom' = hábito desejável; 'ruim' = comportamento a evitar
  positiveIf: 'sim' | 'nao' | 'positivo';
  positiveLabel: string;
  negativeLabel: string;
  frequency: 'todos_os_dias' | 'dias_uteis' | 'fins_de_semana' | 'personalizado';
  activeDays?: number[]; // [0=Dom, 1=Seg, ...]
  order?: number;
}

export type QuestionChoice = 'sim' | 'nao' | 'nao_se_aplica' | 'nao_lembro';

export interface QuestionResponse {
  id: string;
  questionId: string;
  date: string; // YYYY-MM-DD
  choice?: QuestionChoice;
  value: QuestionResponseValue;
  note?: string;
  updatedAt: string;
}

export interface DayMapaRecord {
  date: string;
  factors: string[];
  notes?: string;
}

export type MoodValue = 'otimo' | 'bem' | 'neutro' | 'triste' | 'ansiosa';

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  value: MoodValue;
  label: string;
  factors: string[];
  notes?: string;
  positiveScore: number; // 0 - 100
  timestamp: string;
}

export interface AgendaCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface WeeklyFixedTopic {
  id: string;
  dayOfWeek: number; // 0=Dom, 1=Seg, ... 6=Sab
  dayName: string;
  title: string;
  icon: string;
  time?: string;
  description?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  displayDay: string; // ex: 'Terça-feira'
  isRecurring: boolean;
  recurrenceType?: 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'personalizado';
  recurrenceIntervalDays?: number;
  recurrenceEndDate?: string; // YYYY-MM-DD
  recurrenceLabel?: string;
  completed: boolean;
  categoryId?: string;
  category: 'familia' | 'esporte' | 'pessoal' | 'saude' | 'trabalho' | string;
  icon: string;
  reminderMinutes?: number;
  hasVisualNotification?: boolean;
  alarmEnabled?: boolean;
  location?: string;
  assignedMemberId?: string;
}

export interface RoutineTaskReminder {
  enabled: boolean;
  balloon: boolean;
  alarm: boolean;
  sound: boolean;
  voiceAlert: boolean;
}

export interface RoutineTask {
  id: string;
  title: string;
  subtitle?: string;
  period: PeriodKey;
  completed: boolean;
  time?: string;
  iconName?: string;
  tag?: string;
  groupName?: string;
  subgroupName?: string;
  daysOfWeek?: number[];
  activeDaysLabel?: string;
  reminder?: RoutineTaskReminder;
  statusHistory?: 'pendente' | 'viu' | 'fez' | 'adiado';
  snoozedUntil?: string;
}

export interface DailyChronologicalStep {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon: string;
  completed: boolean;
  voiceAlert: boolean;
  period: PeriodKey;
  isRecurringAuto?: boolean;
}

export interface ContextualReminder {
  id: string;
  text: string;
  period: PeriodKey;
  active: boolean;
  date: string;
}

// Health (Saúde) Module Types (3 Abas: Datas, Medicamentos, Anotações)
export interface HealthDateItem {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'consulta' | 'exame' | 'vacina' | 'prazo' | 'outro';
  professionalOrClinic?: string;
  notes?: string;
  completed: boolean;
  isRecurring?: boolean;
  recurrenceInterval?: 'anual' | 'semestral' | 'mensal';
  recurrenceMonth?: string;
  nextDueDate?: string;
  statusLabel?: string;
}

export interface HealthMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  memberId: string;
  memberName: string;
  time: string;
  confirmed: boolean;
  category: 'medicamento' | 'suplemento' | 'cuidado';
  alarmEnabled?: boolean;
  balloonAlert?: boolean;
  soundAlert?: boolean;
  status?: 'pendente' | 'viu' | 'fez' | 'adiado';
  snoozedUntil?: string;
  instructions?: string;
}

export interface HealthNoteItem {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  category: 'medicao' | 'exame' | 'geral' | 'alergia';
  date: string;
  content: string;
  metrics?: { label: string; value: string }[];
}

export interface HealthGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface GoalCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface GoalStep {
  id: string;
  text: string;
  done: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  categoryId: string;
  category: string;
  progressPercent: number;
  totalSteps: number;
  completedSteps: number;
  steps: GoalStep[];
  deadlineType: 'data_especifica' | 'contagem_dias';
  dueDate?: string; // YYYY-MM-DD
  targetDays?: number; // Contagem regressiva de dias restantes
  startDate?: string;
  status: 'em_andamento' | 'concluida';
}

export interface RecurringTaskItem {
  id: string;
  title: string;
  recurrence: string;
  nextDate: string;
  status: 'pendente' | 'hoje' | 'concluido';
  icon: string;
  notes?: string;
  showOnCalendar?: boolean;
  daysOfWeek?: number[];
  time?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'lembrete' | 'familia' | 'rotina' | 'saude';
}

export interface TaskExecutionRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  displayDate: string;
  completedAt: string;
}

export interface NotificationPreferences {
  routineReminders: boolean;
  agendaReminders: boolean;
  mapaDailyReminder: boolean;
  soundAlerts: boolean;
  voiceAlerts: boolean;
}

export type NavTab =
  | 'inicio'
  | 'mapa'
  | 'agenda'
  | 'rotinas'
  | 'relatorios'
  | 'saude'
  | 'cuidados' // alias for backwards compatibility
  | 'metas'
  | 'recorrentes'
  | 'mais'
  | 'ia'
  | 'configuracoes';

export interface BottomNavSlot {
  tab: NavTab;
  label: string;
  icon: string;
}

export interface MonthlyReviewData {
  period: string;
  positiveRate: number;
  mapSummary: {
    evaluatedCount: number;
    positiveCount: number;
    negativeCount: number;
    topArea: string;
    topAreaScore: number;
  };
  routineRegularity: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    bestPeriod: string;
  };
  agendaSummary: {
    totalEvents: number;
    completedEvents: number;
    complianceRate: number;
  };
  healthCompliance: {
    totalDoses: number;
    confirmedDoses: number;
    complianceRate: number;
  };
  goalsSummary: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    completedNames: string[];
  };
  pendingTasks: string[];
  patternsDetected: string[];
  warmAnalysisText: string;
  suggestionsNextMonth: string[];
}
