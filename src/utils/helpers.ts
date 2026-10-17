import { Category, ScheduleTask, DayAgendaNote, Habit, FinanceEntry, LifeGoal, RewardItem, RecurringRoutine } from '../types';

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // Cross-midnight support
  return diff;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function formatMinutesHuman(minutes: number): string {
  if (minutes <= 0) return '0 dk';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} sa ${m} dk`;
  if (h > 0) return `${h} saat`;
  return `${m} dk`;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Derin Çalışma & İş', color: '#6366f1', icon: 'Briefcase', weeklyTargetHours: 30, pointMultiplier: 1.5 },
  { id: 'cat-study', name: 'Eğitim & Gelişim', color: '#06b6d4', icon: 'BookOpen', weeklyTargetHours: 14, pointMultiplier: 1.4 },
  { id: 'cat-health', name: 'Spor & Sağlık', color: '#10b981', icon: 'HeartPulse', weeklyTargetHours: 7, pointMultiplier: 1.3 },
  { id: 'cat-errands', name: 'Randevu & Dış İşler', color: '#f59e0b', icon: 'MapPin', weeklyTargetHours: 5, pointMultiplier: 1.1 },
  { id: 'cat-routine', name: 'Yaşam & Rutin', color: '#a855f7', icon: 'Coffee', weeklyTargetHours: 10, pointMultiplier: 1.0 },
  { id: 'cat-leisure', name: 'Dinlenme & Sosyal', color: '#ec4899', icon: 'Gamepad2', weeklyTargetHours: 10, pointMultiplier: 0.8 },
];

export const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: 'rew-1',
    title: '2 Saat Suçluluk Duymadan Oyun / Film Keyfi',
    description: 'Tüm görevler onaylandıktan sonra tam odak serbest zaman ödülü.',
    cost: 350,
    icon: 'Gamepad2',
    category: 'Eğlence',
  },
  {
    id: 'rew-2',
    title: 'Favori Kahve & Tatlı Molası',
    description: 'Dışarıda veya siparişle özel kahve/tatlı ödülü.',
    cost: 500,
    icon: 'Coffee',
    category: 'Keyif',
  },
  {
    id: 'rew-3',
    title: 'Cheat Meal / Favori Restoran Siparişi',
    description: 'Haftalık disiplin zincirini koruduğunda özel yemek ödülü.',
    cost: 900,
    icon: 'Utensils',
    category: 'Gastronomi',
  },
  {
    id: 'rew-4',
    title: 'Yeni Kitap / Kurs / Oyun Satın Alma İzni',
    description: 'İstek listesindeki bir içeriği bütçeden satın alma hakkı.',
    cost: 1800,
    icon: 'BookOpen',
    category: 'Gelişim & Hobi',
  },
  {
    id: 'rew-5',
    title: 'Tam Gün Serbest Hafta Sonu Kaçamağı',
    description: 'Alarm kurmadan, tamamen dinlenme ve gezme odaklı gün.',
    cost: 3000,
    icon: 'Sparkles',
    category: 'Yaşam',
  },
  {
    id: 'rew-6',
    title: 'Büyük Ekipman / Teknoloji Hedefi Ödülü',
    description: 'Uzun süreli disiplin birikimiyle kendine büyük hediye.',
    cost: 7500,
    icon: 'Trophy',
    category: 'Büyük Ödül',
  },
];

export const LEGACY_MOCK_TASK_IDS = [
  'task-1',
  'task-2',
  'task-3',
  'task-4',
  'task-5',
  'task-6',
  'task-y1',
  'task-y2',
  'task-f1',
  'task-f2',
];

export const LEGACY_MOCK_ROUTINE_IDS = ['rout-shift', 'rout-morning', 'rout-sport'];

export const LEGACY_MOCK_HABIT_IDS = [
  'hab-1',
  'hab-2',
  'hab-3',
  'hab-4',
  'hab-5',
  'hab-water',
  'hab-book',
  'hab-clean-food',
  'hab-steps',
];

export const LEGACY_MOCK_GOAL_IDS = ['goal-1', 'goal-2'];
export const LEGACY_MOCK_FINANCE_IDS = ['fin-1', 'fin-2', 'fin-3', 'fin-4'];

export function getInitialTasks(_todayStr: string): ScheduleTask[] {
  return [];
}

export function getInitialDayNotes(_todayStr: string): Record<string, DayAgendaNote> {
  return {};
}

export const DEFAULT_HABITS: Habit[] = [];

export const DEFAULT_GOALS: LifeGoal[] = [];

export const DEFAULT_FINANCE: FinanceEntry[] = [];

export const WEEKDAY_OPTIONS: { day: number; short: string; label: string }[] = [
  { day: 1, short: 'Pzt', label: 'Pazartesi' },
  { day: 2, short: 'Sal', label: 'Salı' },
  { day: 3, short: 'Çar', label: 'Çarşamba' },
  { day: 4, short: 'Per', label: 'Perşembe' },
  { day: 5, short: 'Cum', label: 'Cuma' },
  { day: 6, short: 'Cmt', label: 'Cumartesi' },
  { day: 0, short: 'Paz', label: 'Pazar' },
];

export const DEFAULT_RECURRING_ROUTINES: RecurringRoutine[] = [];


