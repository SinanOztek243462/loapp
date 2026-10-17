import {
  Category,
  ScheduleTask,
  Habit,
  LifeGoal,
  RewardRedemption,
  PriorityLevel,
} from '../types';
import { calculateDurationMinutes } from './helpers';

export const PRIORITY_MULTIPLIERS: Record<PriorityLevel, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.25,
  critical: 1.5,
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Düşük (0.8x)',
  medium: 'Normal (1.0x)',
  high: 'Yüksek (1.25x)',
  critical: 'Kritik (1.5x)',
};

export interface TaskPointBreakdown {
  durationMinutes: number;
  categoryMultiplier: number;
  priorityMultiplier: number;
  rewardPoints: number; // Earned when approved (+)
  postponePenalty: number; // Deducted when postponed (-)
  cancelPenalty: number; // Deducted when cancelled (-)
  currentNetPoints: number; // Current active contribution based on task.status
}

export function calculateTaskPointBreakdown(
  task: ScheduleTask,
  categories: Category[]
): TaskPointBreakdown {
  const dur =
    task.status === 'approved' && task.approvedDurationMinutes
      ? task.approvedDurationMinutes
      : calculateDurationMinutes(task.startTime, task.endTime);

  const cat = categories.find((c) => c.id === task.categoryId);
  const catMult = cat?.pointMultiplier ?? 1.0;
  const prioMult = PRIORITY_MULTIPLIERS[task.priority] ?? 1.0;

  // Base: 1 minute = 1 point before multipliers
  const rawReward = Math.max(10, Math.round(dur * catMult * prioMult));
  const postponePenalty = -Math.max(8, Math.round(rawReward * 0.15)); // Mild penalty for postponing
  const cancelPenalty = -Math.max(25, Math.round(rawReward * 0.45)); // Meaningful penalty for cancelling

  let currentNetPoints = 0;
  if (task.status === 'approved') {
    currentNetPoints = rawReward;
  } else if (task.status === 'postponed') {
    currentNetPoints = postponePenalty;
  } else if (task.status === 'cancelled') {
    currentNetPoints = cancelPenalty;
  }

  return {
    durationMinutes: dur,
    categoryMultiplier: catMult,
    priorityMultiplier: prioMult,
    rewardPoints: rawReward,
    postponePenalty,
    cancelPenalty,
    currentNetPoints,
  };
}

export interface DailyDisciplineReport {
  date: string;
  hasActivity: boolean;
  score100: number; // 0 to 100
  letterGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | '-';
  gradeColor: string;
  netPoints: number;
  earnedPoints: number;
  penaltyPoints: number;
  habitBonusPoints: number;
  approvedCount: number;
  totalTasksCount: number;
}

export function calculateDailyDiscipline(
  dateStr: string,
  tasks: ScheduleTask[],
  habits: Habit[],
  categories: Category[]
): DailyDisciplineReport {
  const dayTasks = tasks.filter((t) => t.date === dateStr);
  const completedHabitsCount = habits.filter((h) =>
    h.completedDates.includes(dateStr)
  ).length;

  let earnedPoints = 0;
  let penaltyPoints = 0;
  let approvedMinutes = 0;
  let totalPlannedMinutes = 0;
  let approvedCount = 0;
  let cancelledCount = 0;
  let postponedCount = 0;

  dayTasks.forEach((t) => {
    const bd = calculateTaskPointBreakdown(t, categories);
    const dur = calculateDurationMinutes(t.startTime, t.endTime);
    totalPlannedMinutes += dur;

    if (t.status === 'approved') {
      earnedPoints += bd.rewardPoints;
      approvedMinutes += t.approvedDurationMinutes ?? dur;
      approvedCount++;
    } else if (t.status === 'postponed') {
      penaltyPoints += bd.postponePenalty; // negative
      postponedCount++;
    } else if (t.status === 'cancelled') {
      penaltyPoints += bd.cancelPenalty; // negative
      cancelledCount++;
    }
  });

  const habitBonusPoints = completedHabitsCount * 35;
  const netPoints = earnedPoints + habitBonusPoints + penaltyPoints;
  const hasActivity = dayTasks.length > 0 || completedHabitsCount > 0;

  if (!hasActivity) {
    return {
      date: dateStr,
      hasActivity: false,
      score100: 0,
      letterGrade: '-',
      gradeColor: '#64748b',
      netPoints: 0,
      earnedPoints: 0,
      penaltyPoints: 0,
      habitBonusPoints: 0,
      approvedCount: 0,
      totalTasksCount: 0,
    };
  }

  // Compute 0-100 Discipline Score:
  // 80% weight from Task Completion Ratio (approved minutes / total planned minutes)
  // +20% bonus from Daily Habits completion
  // Minus penalties for cancelled (-12 pts each) and postponed (-4 pts each)
  const taskRatio =
    totalPlannedMinutes > 0 ? approvedMinutes / totalPlannedMinutes : 0.7;
  const habitRatio =
    habits.length > 0 ? completedHabitsCount / habits.length : 0;

  let rawScore = Math.round(taskRatio * 85 + habitRatio * 20);
  rawScore -= cancelledCount * 12;
  rawScore -= postponedCount * 4;

  const score100 = Math.max(0, Math.min(100, rawScore));

  let letterGrade: DailyDisciplineReport['letterGrade'] = 'F';
  let gradeColor = '#f43f5e'; // Rose

  if (score100 >= 92) {
    letterGrade = 'S';
    gradeColor = '#a855f7'; // Purple-Gold
  } else if (score100 >= 80) {
    letterGrade = 'A';
    gradeColor = '#10b981'; // Emerald
  } else if (score100 >= 65) {
    letterGrade = 'B';
    gradeColor = '#06b6d4'; // Cyan
  } else if (score100 >= 50) {
    letterGrade = 'C';
    gradeColor = '#f59e0b'; // Amber
  } else if (score100 >= 35) {
    letterGrade = 'D';
    gradeColor = '#f97316'; // Orange
  }

  return {
    date: dateStr,
    hasActivity: true,
    score100,
    letterGrade,
    gradeColor,
    netPoints,
    earnedPoints,
    penaltyPoints,
    habitBonusPoints,
    approvedCount,
    totalTasksCount: dayTasks.length,
  };
}

export interface RankTier {
  level: number;
  title: string;
  minXP: number;
  nextXP: number;
  badgeColor: string;
}

const RANK_TIERS: RankTier[] = [
  { level: 1, title: 'Başlangıç Yolcusu', minXP: 0, nextXP: 500, badgeColor: '#94a3b8' },
  { level: 2, title: 'Düzen Kurucu', minXP: 500, nextXP: 1200, badgeColor: '#38bdf8' },
  { level: 3, title: 'Zaman Çırağı', minXP: 1200, nextXP: 2200, badgeColor: '#10b981' },
  { level: 4, title: 'Odak Savaşçısı', minXP: 2200, nextXP: 3500, badgeColor: '#6366f1' },
  { level: 5, title: 'Disiplin Ustası', minXP: 3500, nextXP: 5200, badgeColor: '#a855f7' },
  { level: 6, title: 'İrade Mimarı', minXP: 5200, nextXP: 7500, badgeColor: '#f59e0b' },
  { level: 7, title: 'LifeOS Efsanesi', minXP: 7500, nextXP: 15000, badgeColor: '#ec4899' },
];

export interface OverallProfileStats {
  totalEarnedPoints: number;
  totalPenaltyPoints: number;
  totalHabitPoints: number;
  totalGoalPoints: number;
  netLifetimePoints: number;
  totalSpentPoints: number;
  spendableBalance: number;
  rank: RankTier;
  levelProgressPct: number;
}

export function calculateOverallProfile(
  tasks: ScheduleTask[],
  habits: Habit[],
  goals: LifeGoal[],
  categories: Category[],
  redemptions: RewardRedemption[]
): OverallProfileStats {
  let totalEarnedPoints = 0;
  let totalPenaltyPoints = 0;

  tasks.forEach((t) => {
    const bd = calculateTaskPointBreakdown(t, categories);
    if (bd.currentNetPoints > 0) {
      totalEarnedPoints += bd.currentNetPoints;
    } else if (bd.currentNetPoints < 0) {
      totalPenaltyPoints += bd.currentNetPoints; // negative
    }
  });

  const totalHabitChecks = habits.reduce(
    (s, h) => s + h.completedDates.length,
    0
  );
  const totalHabitPoints = totalHabitChecks * 35;

  const completedMilestones = goals.reduce(
    (s, g) => s + g.milestones.filter((m) => m.done).length,
    0
  );
  const totalGoalPoints = completedMilestones * 120;

  const netLifetimePoints = Math.max(
    0,
    totalEarnedPoints + totalHabitPoints + totalGoalPoints + totalPenaltyPoints
  );

  const totalSpentPoints = redemptions.reduce((s, r) => s + r.cost, 0);
  const spendableBalance = Math.max(0, netLifetimePoints - totalSpentPoints);

  // Determine Rank Tier from netLifetimePoints
  let currentRank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (netLifetimePoints >= tier.minXP) {
      currentRank = tier;
    }
  }

  const span = currentRank.nextXP - currentRank.minXP;
  const intoLevel = netLifetimePoints - currentRank.minXP;
  const levelProgressPct = Math.max(
    0,
    Math.min(100, Math.round((intoLevel / span) * 100))
  );

  return {
    totalEarnedPoints,
    totalPenaltyPoints,
    totalHabitPoints,
    totalGoalPoints,
    netLifetimePoints,
    totalSpentPoints,
    spendableBalance,
    rank: currentRank,
    levelProgressPct,
  };
}
