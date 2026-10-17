import React, { useState, useEffect, useMemo } from 'react';
import {
  Category,
  ScheduleTask,
  DayAgendaNote,
  Habit,
  FinanceEntry,
  LifeGoal,
  RewardItem,
  RewardRedemption,
  LootPoolItem,
  DroppedItem,
  RarityTier,
  RecurringRoutine,
} from './types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_HABITS,
  DEFAULT_GOALS,
  DEFAULT_FINANCE,
  DEFAULT_REWARDS,
  DEFAULT_RECURRING_ROUTINES,
  getInitialTasks,
  getInitialDayNotes,
  formatDateISO,
  calculateDurationMinutes,
  addMinutesToTime,
} from './utils/helpers';
import {
  calculateOverallProfile,
  calculateDailyDiscipline,
} from './utils/scoring';
import {
  DEFAULT_LOOT_POOL,
  RARITY_CONFIG,
  FusionRecipe,
  calculateFusionOdds,
  createDroppedItemFromTier,
  calculateTaskDropTriggerChance,
  rollLootDrop,
} from './utils/loot';
import { triggerDesktopNotification, playNotificationSound } from './utils/sound';
import { DailyScheduleSheet } from './components/DailyScheduleSheet';
import { CategoryPieChart } from './components/CategoryPieChart';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { LifeOSModules } from './components/LifeOSModules';
import { PointsAndRewardsView } from './components/PointsAndRewardsView';
import { ApprovalModal } from './components/ApprovalModal';
import { LootDropPopup } from './components/LootDropPopup';
import { RecurringRoutinesModal } from './components/RecurringRoutinesModal';
import {
  SystemSettingsModal,
  LifeOSFullBackupData,
  saveBackupToDisk,
} from './components/SystemSettingsModal';
import {
  Calendar,
  PieChart,
  Layers,
  Bell,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ListTodo,
  Columns,
  Gift,
  Repeat,
  ShieldCheck,
} from 'lucide-react';

export function App() {
  const todayStr = useMemo(() => formatDateISO(new Date()), []);

  const [hierarchyView, setHierarchyView] = useState<
    'daily' | 'monthly' | 'rewards' | 'lifeos'
  >('daily');

  const [dailySubMode, setDailySubMode] = useState<'split' | 'table' | 'pie'>('split');

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Persistent States in localStorage
  const [categories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('lifeos_categories_v2');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [tasks, setTasks] = useState<ScheduleTask[]>(() => {
    const saved = localStorage.getItem('lifeos_tasks');
    return saved ? JSON.parse(saved) : getInitialTasks(todayStr);
  });

  const [dayNotes, setDayNotes] = useState<Record<string, DayAgendaNote>>(() => {
    const saved = localStorage.getItem('lifeos_day_notes');
    const parsed: Record<string, DayAgendaNote> = saved
      ? JSON.parse(saved)
      : getInitialDayNotes(todayStr);
    // Clean legacy recurring water intake note from one-off agenda highlights
    Object.keys(parsed).forEach((dateKey) => {
      if (parsed[dateKey]?.highlights) {
        parsed[dateKey].highlights = parsed[dateKey].highlights.filter(
          (h) => !h.toLowerCase().includes('su tüketimi')
        );
      }
    });
    return parsed;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('lifeos_habits');
    if (!saved) return DEFAULT_HABITS;
    try {
      const parsed: Habit[] = JSON.parse(saved);
      // Upgrade any legacy habit items that lack dailyTargetValue/unit
      const hasQuotaFields = parsed.some((h) => h.dailyTargetValue !== undefined);
      if (!hasQuotaFields) {
        return DEFAULT_HABITS;
      }
      return parsed;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [goals, setGoals] = useState<LifeGoal[]>(() => {
    const saved = localStorage.getItem('lifeos_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [finance, setFinance] = useState<FinanceEntry[]>(() => {
    const saved = localStorage.getItem('lifeos_finance');
    return saved ? JSON.parse(saved) : DEFAULT_FINANCE;
  });

  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('lifeos_rewards');
    return saved ? JSON.parse(saved) : DEFAULT_REWARDS;
  });

  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(() => {
    const saved = localStorage.getItem('lifeos_redemptions');
    return saved ? JSON.parse(saved) : [];
  });

  // Loot & Monthly Income States
  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_monthly_income');
    return saved ? Number(saved) : 65000;
  });

  const [lootPool, setLootPool] = useState<LootPoolItem[]>(() => {
    const saved = localStorage.getItem('lifeos_loot_pool');
    return saved ? JSON.parse(saved) : DEFAULT_LOOT_POOL;
  });

  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>(() => {
    const saved = localStorage.getItem('lifeos_dropped_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [pityStreak, setPityStreak] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_pity_streak');
    return saved ? Number(saved) : 0;
  });

  const [activeLootPopup, setActiveLootPopup] = useState<DroppedItem | null>(null);

  // Recurring Daily Routines & Work Shifts (Entered ONCE, auto-populated on matching weekdays)
  const [recurringRoutines, setRecurringRoutines] = useState<RecurringRoutine[]>(() => {
    const saved = localStorage.getItem('lifeos_recurring_routines');
    return saved ? JSON.parse(saved) : DEFAULT_RECURRING_ROUTINES;
  });

  const [skippedRoutineKeys, setSkippedRoutineKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('lifeos_skipped_routines');
    return saved ? JSON.parse(saved) : [];
  });

  const [isRoutinesModalOpen, setIsRoutinesModalOpen] = useState(false);
  const [routinesModalTab, setRoutinesModalTab] = useState<'shifts' | 'quotas'>('shifts');
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  // Live Clock & Background Task Expiration Watcher
  const [now, setNow] = useState<Date>(() => new Date());

  // Pomodoro / Focus Timer State
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [activePomoTaskTitle, setActivePomoTaskTitle] = useState<string | null>(null);

  const getBackupPayload = (): LifeOSFullBackupData => ({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tasks,
    recurringRoutines,
    skippedRoutineKeys,
    habits,
    finance,
    goals,
    categories,
    dayNotes,
    rewards,
    redemptions,
    monthlyIncome,
    lootPool,
    droppedItems,
    pityStreak,
  });

  const handleRestoreBackupPayload = (data: Partial<LifeOSFullBackupData>) => {
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (Array.isArray(data.recurringRoutines)) setRecurringRoutines(data.recurringRoutines);
    if (Array.isArray(data.skippedRoutineKeys)) setSkippedRoutineKeys(data.skippedRoutineKeys);
    if (Array.isArray(data.habits)) setHabits(data.habits);
    if (Array.isArray(data.finance)) setFinance(data.finance);
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (data.dayNotes && typeof data.dayNotes === 'object') setDayNotes(data.dayNotes);
    if (Array.isArray(data.rewards)) setRewards(data.rewards);
    if (Array.isArray(data.redemptions)) setRedemptions(data.redemptions);
    if (typeof data.monthlyIncome === 'number') setMonthlyIncome(data.monthlyIncome);
    if (Array.isArray(data.lootPool)) setLootPool(data.lootPool);
    if (Array.isArray(data.droppedItems)) setDroppedItems(data.droppedItems);
    if (typeof data.pityStreak === 'number') setPityStreak(data.pityStreak);
    playNotificationSound('complete');
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('lifeos_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('lifeos_day_notes', JSON.stringify(dayNotes));
  }, [dayNotes]);

  useEffect(() => {
    localStorage.setItem('lifeos_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('lifeos_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('lifeos_finance', JSON.stringify(finance));
  }, [finance]);

  useEffect(() => {
    localStorage.setItem('lifeos_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('lifeos_redemptions', JSON.stringify(redemptions));
  }, [redemptions]);

  useEffect(() => {
    localStorage.setItem('lifeos_monthly_income', String(monthlyIncome));
  }, [monthlyIncome]);

  useEffect(() => {
    localStorage.setItem('lifeos_loot_pool', JSON.stringify(lootPool));
  }, [lootPool]);

  useEffect(() => {
    localStorage.setItem('lifeos_dropped_items', JSON.stringify(droppedItems));
  }, [droppedItems]);

  useEffect(() => {
    localStorage.setItem('lifeos_pity_streak', String(pityStreak));
  }, [pityStreak]);

  useEffect(() => {
    localStorage.setItem('lifeos_recurring_routines', JSON.stringify(recurringRoutines));
  }, [recurringRoutines]);

  useEffect(() => {
    localStorage.setItem('lifeos_skipped_routines', JSON.stringify(skippedRoutineKeys));
  }, [skippedRoutineKeys]);

  // Automatically mirror state to disk (d:\organizator\backups\LifeOS-AutoBackup.json)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveBackupToDisk(getBackupPayload()).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    tasks,
    recurringRoutines,
    skippedRoutineKeys,
    habits,
    finance,
    goals,
    dayNotes,
    rewards,
    redemptions,
    monthlyIncome,
    lootPool,
    droppedItems,
    pityStreak,
  ]);

  // Automatically populate matching Recurring Routines / Work Shifts for the selectedDate!
  useEffect(() => {
    const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay(); // 0=Sun..6=Sat
    const matchingRoutines = recurringRoutines.filter(
      (r) => r.active && r.daysOfWeek.includes(dayOfWeek)
    );
    if (matchingRoutines.length === 0) return;

    setTasks((prevTasks) => {
      const dayTasks = prevTasks.filter((t) => t.date === selectedDate);
      const newTasksToAppend: ScheduleTask[] = [];

      for (const routine of matchingRoutines) {
        const skipKey = `${routine.id}_${selectedDate}`;
        if (skippedRoutineKeys.includes(skipKey)) continue;

        const alreadyExists = dayTasks.some(
          (t) =>
            t.routineTemplateId === routine.id ||
            (t.title === routine.title && t.startTime === routine.startTime)
        );

        if (!alreadyExists) {
          newTasksToAppend.push({
            id: `task-rout-${routine.id}-${selectedDate}`,
            date: selectedDate,
            startTime: routine.startTime,
            endTime: routine.endTime,
            title: routine.title,
            categoryId: routine.categoryId,
            priority: routine.priority,
            status: 'planned',
            notes: routine.notes,
            routineTemplateId: routine.id,
          });
        }
      }

      return newTasksToAppend.length > 0
        ? [...prevTasks, ...newTasksToAppend]
        : prevTasks;
    });
  }, [selectedDate, recurringRoutines, skippedRoutineKeys]);

  // Real-time 1-second tick for clock, Pomodoro, and Automatic Task End-Time Approval Checker
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);

      const curDateStr = formatDateISO(current);
      const curHHMM = `${String(current.getHours()).padStart(2, '0')}:${String(
        current.getMinutes()
      ).padStart(2, '0')}`;

      setTasks((prevTasks) => {
        let changed = false;
        const nextTasks = prevTasks.map((t) => {
          if (
            t.date === curDateStr &&
            t.status === 'planned' &&
            t.endTime <= curHHMM &&
            t.startTime < t.endTime
          ) {
            changed = true;
            const cat =
              categories.find((c) => c.id === t.categoryId)?.name || 'Genel';
            triggerDesktopNotification({
              id: t.id,
              title: t.title,
              startTime: t.startTime,
              endTime: t.endTime,
              categoryName: cat,
            });
            return {
              ...t,
              status: 'awaiting_approval' as const,
              notified: true,
            };
          }
          return t;
        });
        return changed ? nextTasks : prevTasks;
      });

      setPomoSeconds((prev) => {
        if (!pomoRunning) return prev;
        if (prev <= 1) {
          setPomoRunning(false);
          playNotificationSound('complete');
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pomoRunning, categories]);

  const currentTimeHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  // Overall Profile & Selected Day Discipline Stats
  const profileStats = useMemo(
    () => calculateOverallProfile(tasks, habits, goals, categories, redemptions),
    [tasks, habits, goals, categories, redemptions]
  );

  const selectedDayDiscipline = useMemo(
    () => calculateDailyDiscipline(selectedDate, tasks, habits, categories),
    [selectedDate, tasks, habits, categories]
  );

  // Tasks currently waiting for user approval
  const [dismissedModalIds, setDismissedModalIds] = useState<string[]>([]);
  const pendingApprovalTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status === 'awaiting_approval' && !dismissedModalIds.includes(t.id)
    );
  }, [tasks, dismissedModalIds]);

  // Execute a Loot Roll and add to inventory
  const executeLootRoll = (sourceLabel: string, luckMultiplier = 1.0) => {
    const dropped = rollLootDrop({
      monthlyIncome,
      lootPool,
      source: sourceLabel,
      dateStr: todayStr,
      timeStr: currentTimeHHMM,
      luckMultiplier,
      pityStreak,
    });

    setDroppedItems((prev) => [dropped, ...prev]);
    setPityStreak((prev) => (dropped.rarity === 'legendary' ? 0 : prev + 1));
    setActiveLootPopup(dropped);
    playNotificationSound('approval');
  };

  // Task CRUD Handlers
  const handleAddTask = (newTask: Omit<ScheduleTask, 'id'>) => {
    const created: ScheduleTask = {
      ...newTask,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setTasks((prev) => [...prev, created]);
  };

  const handleUpdateTask = (id: string, updates: Partial<ScheduleTask>) => {
    const existing = tasks.find((t) => t.id === id);
    const transitioningToApproved =
      existing && existing.status !== 'approved' && updates.status === 'approved';

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (transitioningToApproved && existing) {
      playNotificationSound('complete');
      // Roll task drop trigger probability P_drop(t, c, p)
      const dropChance = calculateTaskDropTriggerChance(
        { ...existing, ...updates },
        categories
      );
      if (Math.random() <= dropChance) {
        const luck = selectedDayDiscipline.score100 >= 85 ? 1.35 : 1.0;
        executeLootRoll(`Görev Onayı: ${existing.title}`, luck);
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (target?.routineTemplateId) {
      const skipKey = `${target.routineTemplateId}_${target.date}`;
      setSkippedRoutineKeys((prev) =>
        prev.includes(skipKey) ? prev : [...prev, skipKey]
      );
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Recurring Routine / Shift Management Actions
  const handleAddRecurringRoutine = (routine: Omit<RecurringRoutine, 'id'>) => {
    const newRoutine: RecurringRoutine = {
      ...routine,
      id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setRecurringRoutines((prev) => [...prev, newRoutine]);
    playNotificationSound('complete');
  };

  const handleUpdateRecurringRoutine = (
    id: string,
    updates: Partial<RecurringRoutine>
  ) => {
    setRecurringRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    // Also update any unapproved ('planned') tasks linked to this routine template
    setTasks((prev) =>
      prev.map((t) => {
        if (t.routineTemplateId === id && t.status === 'planned') {
          return {
            ...t,
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.startTime !== undefined ? { startTime: updates.startTime } : {}),
            ...(updates.endTime !== undefined ? { endTime: updates.endTime } : {}),
            ...(updates.categoryId !== undefined ? { categoryId: updates.categoryId } : {}),
            ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
          };
        }
        return t;
      })
    );
  };

  const handleDeleteRecurringRoutine = (id: string) => {
    setRecurringRoutines((prev) => prev.filter((r) => r.id !== id));
    // Remove only unapproved ('planned') future/today instances; keep approved history intact
    setTasks((prev) =>
      prev.filter((t) => !(t.routineTemplateId === id && t.status === 'planned'))
    );
  };

  const handleOpenRoutinesModal = (tab: 'shifts' | 'quotas' = 'shifts') => {
    setRoutinesModalTab(tab);
    setIsRoutinesModalOpen(true);
  };

  const handleIncrementHabitProgress = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const targetVal = h.dailyTargetValue ?? 1;
        const stepVal = h.stepValue ?? 1;
        const currentVal = h.dailyProgress?.[dateStr] ?? 0;
        const nextVal = Number(Math.min(targetVal, currentVal + stepVal).toFixed(2));
        const nextProgress = { ...(h.dailyProgress || {}), [dateStr]: nextVal };
        const reachedTarget = nextVal >= targetVal;
        const alreadyCompleted = h.completedDates.includes(dateStr);

        return {
          ...h,
          dailyProgress: nextProgress,
          completedDates:
            reachedTarget && !alreadyCompleted
              ? [...h.completedDates, dateStr]
              : h.completedDates,
        };
      })
    );
    playNotificationSound('complete');
  };

  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        const targetVal = h.dailyTargetValue ?? 1;
        const nextProgress = {
          ...(h.dailyProgress || {}),
          [dateStr]: exists ? 0 : targetVal,
        };
        return {
          ...h,
          dailyProgress: nextProgress,
          completedDates: exists
            ? h.completedDates.filter((d) => d !== dateStr)
            : [...h.completedDates, dateStr],
        };
      })
    );
    playNotificationSound('complete');
  };

  const handleAddHabitQuota = (habit: Omit<Habit, 'id'>) => {
    setHabits((prev) => [
      ...prev,
      {
        ...habit,
        id: `hab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    ]);
    playNotificationSound('complete');
  };

  const handleUpdateHabitQuota = (id: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  const handleDeleteHabitQuota = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  // Approval Modal Actions
  const handleApproveTask = (taskId: string, customMinutes?: number) => {
    const target = tasks.find((t) => t.id === taskId);
    const dur =
      customMinutes ??
      (target ? calculateDurationMinutes(target.startTime, target.endTime) : 60);

    handleUpdateTask(taskId, {
      status: 'approved',
      approvedDurationMinutes: dur,
    });
  };

  const handleExtendTask = (taskId: string, extraMinutes: number) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const newEndTime = addMinutesToTime(target.endTime, extraMinutes);
    handleUpdateTask(taskId, {
      endTime: newEndTime,
      status: 'planned',
    });
  };

  const handlePostponeOrCancel = (
    taskId: string,
    status: 'postponed' | 'cancelled'
  ) => {
    handleUpdateTask(taskId, { status });
  };

  // Open Loot Chest with KP
  const handleOpenLootChest = (
    costKP: number,
    luckMultiplier: number,
    boxName: string
  ) => {
    if (profileStats.spendableBalance < costKP) return;
    const chestRedemption: RewardRedemption = {
      id: `red-chest-${Date.now()}`,
      rewardId: 'loot-chest',
      title: `🎲 ${boxName}`,
      cost: costKP,
      date: todayStr,
      timestamp: currentTimeHHMM,
    };
    setRedemptions((prev) => [chestRedemption, ...prev]);
    executeLootRoll(boxName, luckMultiplier);
  };

  // Blacksmith Item Fusion & Burn Handler
  const handleAttemptFusion = (params: {
    recipe: FusionRecipe;
    itemCount: number;
    useKPBoost: boolean;
  }): { success: boolean; message: string } => {
    const { recipe, itemCount, useKPBoost } = params;
    const odds = calculateFusionOdds({ recipe, itemCount, useKPBoost });

    const matchingUnclaimed = droppedItems.filter(
      (i) => !i.claimed && i.rarity === recipe.fromRarity
    );
    if (matchingUnclaimed.length < itemCount) {
      return {
        success: false,
        message: 'Envanterinizde yeterli sayıda kullanılmamış item bulunmuyor.',
      };
    }

    const idsToConsume = new Set(
      matchingUnclaimed.slice(0, itemCount).map((i) => i.id)
    );

    // Deduct KP boost if selected
    if (useKPBoost) {
      setRedemptions((prev) => [
        {
          id: `red-boost-${Date.now()}`,
          rewardId: 'forge-boost',
          title: '✨ Demirci Kutsama Parşömeni (+%15 Şans)',
          cost: 200,
          date: todayStr,
          timestamp: currentTimeHHMM,
        },
        ...prev,
      ]);
    }

    const roll = Math.random() * 100;
    const isSuccess = roll <= odds.successPct;

    if (isSuccess) {
      const forgedItem = createDroppedItemFromTier({
        chosenTier: recipe.toRarity,
        monthlyIncome,
        lootPool,
        source: `🔥 Demirci Füzyonu (${itemCount}x ${
          RARITY_CONFIG[recipe.fromRarity].nameTR
        })`,
        dateStr: todayStr,
        timeStr: currentTimeHHMM,
      });

      setDroppedItems((prev) => [
        forgedItem,
        ...prev.filter((i) => !idsToConsume.has(i.id)),
      ]);
      setActiveLootPopup(forgedItem);
      playNotificationSound('approval');

      return {
        success: true,
        message: `🎉 FÜZYON BAŞARILI! (${Math.round(roll)} <= %${
          odds.successPct
        }) — ${itemCount}x ${
          RARITY_CONFIG[recipe.fromRarity].nameTR
        } birleşti ve "${forgedItem.title}" (${
          RARITY_CONFIG[recipe.toRarity].nameTR
        } • ${forgedItem.budgetValueTL.toLocaleString('tr-TR')} ₺) üretildi!`,
      };
    } else {
      // BURN (YANMA)! Remove consumed items, grant Ash Consolation KP & +2 Pity
      setDroppedItems((prev) => prev.filter((i) => !idsToConsume.has(i.id)));
      setPityStreak((prev) => prev + 2);
      setRedemptions((prev) => [
        {
          id: `red-ash-${Date.now()}`,
          rewardId: 'forge-ash-refund',
          title: `🔥 Demirci Kül Tesellisi (${itemCount}x Yanan İtem İadesi)`,
          cost: -odds.consolationKP, // Negative cost increases spendable KP balance!
          date: todayStr,
          timestamp: currentTimeHHMM,
        },
        ...prev,
      ]);
      playNotificationSound('burn');

      return {
        success: false,
        message: `🔥 FÜZYON BAŞARISIZ — İTEMLER YANDI! (Zar: ${Math.round(
          roll
        )}, Gereken: <=%${odds.successPct}). Teselli olarak cüzdanınıza +${
          odds.consolationKP
        } KP Kül İadesi ve +2 Efsanevi Pity Şansı eklendi!`,
      };
    }
  };

  // Reward Store Handlers
  const handleRedeemReward = (reward: RewardItem) => {
    if (profileStats.spendableBalance < reward.cost) return;
    playNotificationSound('complete');
    const newRedemption: RewardRedemption = {
      id: `red-${Date.now()}`,
      rewardId: reward.id,
      title: reward.title,
      cost: reward.cost,
      date: todayStr,
      timestamp: currentTimeHHMM,
    };
    setRedemptions((prev) => [newRedemption, ...prev]);
  };

  const handleAddReward = (newReward: Omit<RewardItem, 'id'>) => {
    setRewards((prev) => [
      ...prev,
      { ...newReward, id: `rew-${Date.now()}` },
    ]);
  };

  const handleDeleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRefundRedemption = (redemptionId: string) => {
    setRedemptions((prev) => prev.filter((r) => r.id !== redemptionId));
  };

  // Day Note update
  const handleUpdateDayNote = (
    dateStr: string,
    summaryNote: string,
    highlights: string[]
  ) => {
    setDayNotes((prev) => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        summaryNote,
        highlights,
      },
    }));
  };

  const formattedSelectedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const stepDay = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(formatDateISO(d));
  };

  const formatPomo = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalAwaitingCount = tasks.filter(
    (t) => t.status === 'awaiting_approval'
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Navigation & Hierarchy Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 bg-slate-900/95 px-5 py-2.5 shrink-0">
        {/* Left: App Brand & Hierarchy Date Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base shadow-lg shadow-indigo-500/25">
              L
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-white">
                  LifeOS
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Aktif
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Zaman & Disiplin Organizatörü
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* HIERARCHY DATE TRIGGER: Clicking the date throws you into Monthly Calendar view! */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => stepDay(-1)}
              className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Önceki Gün"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() =>
                setHierarchyView((v) => (v === 'monthly' ? 'daily' : 'monthly'))
              }
              className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition ${
                hierarchyView === 'monthly'
                  ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-lg shadow-indigo-500/15'
                  : 'border-slate-700/80 bg-slate-950 hover:border-indigo-500/60 hover:bg-slate-900'
              }`}
              title="Tarihe tıklayarak Aylık Takvim & Ajanda görünümüne geçin"
            >
              <Calendar className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white">
                    {formattedSelectedDate}
                  </span>
                  {selectedDate === todayStr && (
                    <span className="rounded bg-indigo-500/25 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300">
                      BUGÜN
                    </span>
                  )}
                </div>
                <span className="block text-[9px] text-indigo-400 font-medium">
                  {hierarchyView === 'monthly'
                    ? '◀ Günlük Tabloya Dön'
                    : '▲ Aylık Ajanda İçin Tıkla'}
                </span>
              </div>
            </button>

            <button
              onClick={() => stepDay(1)}
              className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Sonraki Gün"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setHierarchyView('daily')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              hierarchyView === 'daily'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>Günlük Program & Pasta</span>
          </button>

          <button
            onClick={() => setHierarchyView('monthly')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              hierarchyView === 'monthly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Aylık Ajanda</span>
          </button>

          <button
            onClick={() => setHierarchyView('rewards')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              hierarchyView === 'rewards'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            <span>İtem Drop & Ödül Mağazası</span>
          </button>

          <button
            onClick={() => setHierarchyView('lifeos')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              hierarchyView === 'lifeos'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Alışkanlık, Hedef & Finans</span>
          </button>
        </div>

        {/* Right: Live Level/KP Wallet Badge, Daily Grade, Pomodoro & Clock */}
        <div className="flex items-center gap-2.5">
          {/* Live Gamification Pill (Level + Spendable KP + Today's Letter Grade) */}
          <button
            onClick={() => setHierarchyView('rewards')}
            className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-slate-950 hover:bg-slate-900 px-3 py-1.5 transition"
            title="İtem Drop & Kişisel Ödül Mağazasını Aç"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs text-white"
              style={{ backgroundColor: profileStats.rank.badgeColor }}
            >
              L{profileStats.rank.level}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-extrabold text-amber-400">
                  {profileStats.spendableBalance.toLocaleString('tr-TR')} KP
                </span>
                <span
                  className="rounded px-1.5 py-0.2 text-[10px] font-mono font-extrabold"
                  style={{
                    backgroundColor: `${selectedDayDiscipline.gradeColor}25`,
                    color: selectedDayDiscipline.gradeColor,
                  }}
                >
                  Gün: {selectedDayDiscipline.letterGrade} ({selectedDayDiscipline.score100}p)
                </span>
              </div>
              <span className="block text-[9px] text-slate-400">
                {profileStats.rank.title} • {droppedItems.length} İtem
              </span>
            </div>
          </button>

          {/* Focus / Pomodoro Mini Bar */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5">
            <div className="text-right">
              <span className="block text-[9px] text-slate-400 truncate max-w-[90px]">
                {activePomoTaskTitle || 'Odak Sayacı'}
              </span>
              <span className="font-mono text-xs font-extrabold text-indigo-400">
                {formatPomo(pomoSeconds)}
              </span>
            </div>
            <button
              onClick={() => setPomoRunning(!pomoRunning)}
              className="rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 p-1.5 transition"
              title={pomoRunning ? 'Duraklat' : 'Başlat'}
            >
              {pomoRunning ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Pending Approvals Trigger */}
          {totalAwaitingCount > 0 && (
            <button
              onClick={() => setDismissedModalIds([])}
              className="flex items-center gap-1 rounded-xl bg-amber-500/20 border border-amber-500/50 px-2.5 py-1.5 text-xs font-bold text-amber-300 animate-pulse"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{totalAwaitingCount} Onay</span>
            </button>
          )}

          {/* System Startup & Backup Center Trigger */}
          <button
            onClick={() => setIsSystemModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-2 text-xs font-bold text-emerald-300 transition"
            title="Windows Oto-Başlatma ve Yedekleme Merkezi"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">Yedek & Oto-Başlat</span>
          </button>

          {/* Live System Clock */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-right font-mono">
            <span className="text-[9px] text-slate-400 block">SAAT</span>
            <span className="text-xs font-bold text-emerald-400">
              {now.toLocaleTimeString('tr-TR')}
            </span>
          </div>
        </div>
      </header>

      {/* Sub-bar when inside 'daily' view */}
      {hierarchyView === 'daily' && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 bg-slate-900/40 px-6 py-2 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                <strong>Günün Disiplin Skoru:</strong>{' '}
                <strong style={{ color: selectedDayDiscipline.gradeColor }}>
                  {selectedDayDiscipline.score100}/100 (Not: {selectedDayDiscipline.letterGrade})
                </strong>
              </span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-xs">
              Bugün Net Kazanım:{' '}
              <strong
                className={
                  selectedDayDiscipline.netPoints >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {selectedDayDiscipline.netPoints >= 0
                  ? `+${selectedDayDiscipline.netPoints}`
                  : selectedDayDiscipline.netPoints}{' '}
                KP
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setDailySubMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                dailySubMode === 'split'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>İkili Görünüm (Tablo + Pasta)</span>
            </button>
            <button
              onClick={() => setDailySubMode('table')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                dailySubMode === 'table'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tam Ekran Saat Listesi
            </button>
            <button
              onClick={() => setDailySubMode('pie')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                dailySubMode === 'pie'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Tam Ekran Pasta Analizi</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 p-5 overflow-hidden">
        {hierarchyView === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            {(dailySubMode === 'split' || dailySubMode === 'table') && (
              <div
                className={`${
                  dailySubMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
                } h-full overflow-hidden`}
              >
                <DailyScheduleSheet
                  selectedDate={selectedDate}
                  tasks={tasks}
                  habits={habits}
                  categories={categories}
                  currentTimeHHMM={currentTimeHHMM}
                  todayStr={todayStr}
                  recurringRoutinesCount={
                    recurringRoutines.filter((r) => r.active).length
                  }
                  onAddTask={handleAddTask}
                  onAddRecurringRoutine={handleAddRecurringRoutine}
                  onOpenRoutinesModal={handleOpenRoutinesModal}
                  onIncrementHabitProgress={handleIncrementHabitProgress}
                  onToggleHabitDate={handleToggleHabitDate}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onTriggerApprovalModal={() => setDismissedModalIds([])}
                  onStartPomodoroForTask={(task) => {
                    setActivePomoTaskTitle(task.title);
                    setPomoSeconds(
                      calculateDurationMinutes(task.startTime, task.endTime) * 60
                    );
                    setPomoRunning(true);
                  }}
                />
              </div>
            )}

            {(dailySubMode === 'split' || dailySubMode === 'pie') && (
              <div
                className={`${
                  dailySubMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
                } h-full overflow-y-auto`}
              >
                <CategoryPieChart
                  selectedDate={selectedDate}
                  tasks={tasks}
                  categories={categories}
                />
              </div>
            )}
          </div>
        )}

        {hierarchyView === 'monthly' && (
          <MonthlyCalendarView
            currentDate={selectedDate}
            todayStr={todayStr}
            tasks={tasks}
            habits={habits}
            categories={categories}
            dayNotes={dayNotes}
            onSelectDateAndEnterDay={(dateStr) => {
              setSelectedDate(dateStr);
              setHierarchyView('daily');
            }}
            onUpdateDayNote={handleUpdateDayNote}
            onAddTask={handleAddTask}
            onIncrementHabitProgress={handleIncrementHabitProgress}
            onToggleHabitDate={handleToggleHabitDate}
            onOpenRoutinesModal={handleOpenRoutinesModal}
          />
        )}

        {hierarchyView === 'rewards' && (
          <PointsAndRewardsView
            selectedDate={selectedDate}
            tasks={tasks}
            habits={habits}
            goals={goals}
            categories={categories}
            rewards={rewards}
            redemptions={redemptions}
            monthlyIncome={monthlyIncome}
            onUpdateMonthlyIncome={setMonthlyIncome}
            lootPool={lootPool}
            droppedItems={droppedItems}
            pityStreak={pityStreak}
            onOpenLootChest={handleOpenLootChest}
            onAttemptFusion={handleAttemptFusion}
            onAddLootPoolItem={(title, rarity) => {
              setLootPool((prev) => [
                ...prev,
                { id: `lp-${Date.now()}`, title, rarity },
              ]);
            }}
            onDeleteLootPoolItem={(id) => {
              setLootPool((prev) => prev.filter((i) => i.id !== id));
            }}
            onToggleClaimDroppedItem={(dropId) => {
              setDroppedItems((prev) =>
                prev.map((d) =>
                  d.id === dropId ? { ...d, claimed: !d.claimed } : d
                )
              );
            }}
            onRedeemReward={handleRedeemReward}
            onAddReward={handleAddReward}
            onDeleteReward={handleDeleteReward}
            onRefundRedemption={handleRefundRedemption}
          />
        )}

        {hierarchyView === 'lifeos' && (
          <LifeOSModules
            selectedDate={selectedDate}
            habits={habits}
            finance={finance}
            goals={goals}
            categories={categories}
            onToggleHabitDate={handleToggleHabitDate}
            onAddHabit={(title, categoryId, targetDaysPerWeek) => {
              handleAddHabitQuota({
                title,
                categoryId,
                targetDaysPerWeek,
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                dailyTargetValue: 1,
                unit: 'Gün',
                stepValue: 1,
                dailyProgress: {},
                completedDates: [],
                active: true,
              });
            }}
            onAddFinance={(entry) => {
              setFinance((prev) => [
                { ...entry, id: `fin-${Date.now()}` },
                ...prev,
              ]);
            }}
            onToggleGoalMilestone={(goalId, milestoneId) => {
              setGoals((prev) =>
                prev.map((g) => {
                  if (g.id !== goalId) return g;
                  return {
                    ...g,
                    milestones: g.milestones.map((m) =>
                      m.id === milestoneId ? { ...m, done: !m.done } : m
                    ),
                  };
                })
              );
              playNotificationSound('complete');
            }}
            onAddGoal={(title, deadline, categoryId) => {
              setGoals((prev) => [
                ...prev,
                {
                  id: `goal-${Date.now()}`,
                  title,
                  deadline,
                  progress: 0,
                  categoryId,
                  milestones: [
                    { id: `m-${Date.now()}-1`, text: 'İlk adımı tamamla', done: false },
                  ],
                },
              ]);
            }}
          />
        )}
      </main>

      {/* Automatic Task Completion Approval Modal */}
      <ApprovalModal
        pendingTasks={pendingApprovalTasks}
        categories={categories}
        onApprove={handleApproveTask}
        onExtend={handleExtendTask}
        onPostponeOrCancel={handlePostponeOrCancel}
      />

      {/* RPG Item Drop Celebration Popup */}
      <LootDropPopup
        droppedItem={activeLootPopup}
        monthlyIncome={monthlyIncome}
        onClose={() => setActiveLootPopup(null)}
      />

      {/* Recurring Daily Routines & Work Shift + Daily Quotas Manager Modal */}
      <RecurringRoutinesModal
        isOpen={isRoutinesModalOpen}
        initialTab={routinesModalTab}
        onClose={() => setIsRoutinesModalOpen(false)}
        routines={recurringRoutines}
        habits={habits}
        categories={categories}
        onAddRoutine={handleAddRecurringRoutine}
        onUpdateRoutine={handleUpdateRecurringRoutine}
        onDeleteRoutine={handleDeleteRecurringRoutine}
        onAddHabitQuota={handleAddHabitQuota}
        onUpdateHabitQuota={handleUpdateHabitQuota}
        onDeleteHabitQuota={handleDeleteHabitQuota}
      />

      {/* System Startup (Windows Autostart) & Backup/Restore Center Modal */}
      <SystemSettingsModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        getBackupPayload={getBackupPayload}
        onRestoreBackupPayload={handleRestoreBackupPayload}
      />
    </div>
  );
}
export default App;
