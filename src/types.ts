export type TaskStatus = 'planned' | 'awaiting_approval' | 'approved' | 'postponed' | 'cancelled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color
  icon: string;
  weeklyTargetHours?: number;
  pointMultiplier?: number; // Multiplier for XP/Points calculation
}

export interface RecurringRoutine {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  categoryId: string;
  priority: PriorityLevel;
  daysOfWeek: number[]; // 0=Paz, 1=Pzt, 2=Sal, 3=Çar, 4=Per, 5=Cum, 6=Cmt
  notes: string;
  active: boolean;
}

export interface ScheduleTask {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  title: string;
  categoryId: string;
  priority: PriorityLevel;
  status: TaskStatus;
  notes: string;
  isAppointment?: boolean; // e.g., Hastane randevusu, dışarı çıkılacak yer
  location?: string;
  notified?: boolean; // Whether end-of-task notification has fired
  approvedDurationMinutes?: number; // Populated when approved
  routineTemplateId?: string; // If auto-generated from a RecurringRoutine
}

export interface DayAgendaNote {
  date: string; // YYYY-MM-DD
  summaryNote: string;
  highlights: string[];
}

export interface Habit {
  id: string;
  title: string;
  categoryId: string;
  targetDaysPerWeek: number;
  completedDates: string[]; // Array of YYYY-MM-DD
  defaultTime?: string; // Optional time to auto-inject into day
  daysOfWeek?: number[]; // 0=Paz..6=Cmt (defaults to all 7 days)
  dailyTargetValue?: number; // e.g. 3 (for 3 Litre Su), 30 (for 30 Sayfa Kitap), 1 (for tick)
  unit?: string; // e.g. 'Litre', 'Sayfa', 'Adet', 'Dk'
  stepValue?: number; // e.g. 0.5 (Litre), 10 (Sayfa), 1
  dailyProgress?: Record<string, number>; // dateStr -> current amount for that day
  active?: boolean; // Defaults to true
}

export interface FinanceEntry {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export interface LifeGoal {
  id: string;
  title: string;
  deadline: string;
  progress: number; // 0 - 100
  categoryId: string;
  milestones: { id: string; text: string; done: boolean }[];
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number; // Cost in KP (Kazanım Puanı)
  icon: string;
  category: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  title: string;
  cost: number;
  date: string; // YYYY-MM-DD
  timestamp: string; // HH:mm
}

export interface LootPoolItem {
  id: string;
  title: string;
  rarity: RarityTier;
  description?: string;
}

export interface DroppedItem {
  id: string;
  title: string;
  rarity: RarityTier;
  incomeSharePct: number; // e.g. 0.5, 1.5, 4, 10, 30
  budgetValueTL: number; // Calculated from monthly income * (incomeSharePct / 100)
  droppedAtDate: string; // YYYY-MM-DD
  droppedAtTime: string; // HH:mm
  source: string; // e.g. 'Görev Onayı: Derin Odak' or 'Ganimet Sandığı'
  claimed: boolean; // Whether user used/claimed this item in real life
}
