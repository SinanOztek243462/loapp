import React, { useState, useMemo } from 'react';
import { Category, ScheduleTask, PriorityLevel, RecurringRoutine, Habit } from '../types';
import { calculateDurationMinutes, formatMinutesHuman, addMinutesToTime } from '../utils/helpers';
import { calculateTaskPointBreakdown, PRIORITY_LABELS } from '../utils/scoring';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  MapPin,
  Play,
  Check,
  X,
  RotateCcw,
  Repeat,
  Droplets,
} from 'lucide-react';

interface DailyScheduleSheetProps {
  selectedDate: string;
  tasks: ScheduleTask[];
  habits: Habit[];
  categories: Category[];
  recurringRoutinesCount: number;
  currentTimeHHMM: string;
  todayStr: string;
  onAddTask: (task: Omit<ScheduleTask, 'id'>) => void;
  onAddRecurringRoutine: (routine: Omit<RecurringRoutine, 'id'>) => void;
  onOpenRoutinesModal: (tab?: 'shifts' | 'quotas') => void;
  onIncrementHabitProgress: (habitId: string, dateStr: string) => void;
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onUpdateTask: (id: string, updates: Partial<ScheduleTask>) => void;
  onDeleteTask: (id: string) => void;
  onTriggerApprovalModal: (task: ScheduleTask) => void;
  onStartPomodoroForTask: (task: ScheduleTask) => void;
}

export const DailyScheduleSheet: React.FC<DailyScheduleSheetProps> = ({
  selectedDate,
  tasks,
  habits,
  categories,
  recurringRoutinesCount,
  currentTimeHHMM,
  todayStr,
  onAddTask,
  onAddRecurringRoutine,
  onOpenRoutinesModal,
  onIncrementHabitProgress,
  onToggleHabitDate,
  onUpdateTask,
  onDeleteTask,
  onStartPomodoroForTask,
}) => {
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:30');
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || 'cat-work');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('high');
  const [newNotes, setNewNotes] = useState('');
  const [newIsAppointment, setNewIsAppointment] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'once' | 'weekdays' | 'everyday' | 'weekends'>('once');

  const [viewMode, setViewMode] = useState<'spreadsheet' | 'timeline24'>('spreadsheet');

  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, selectedDate]);

  const dayAutoQuotas = useMemo(() => {
    const dow = new Date(selectedDate + 'T12:00:00').getDay();
    return habits.filter((h) => {
      if (h.active === false) return false;
      const days = h.daysOfWeek || [1, 2, 3, 4, 5, 6, 0];
      return days.includes(dow);
    });
  }, [habits, selectedDate]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (repeatMode === 'once') {
      onAddTask({
        date: selectedDate,
        startTime: newStart,
        endTime: newEnd,
        title: newTitle.trim(),
        categoryId: newCategoryId,
        priority: newPriority,
        status: 'planned',
        notes: newNotes.trim(),
        isAppointment: newIsAppointment,
      });
    } else {
      // Save as permanent RecurringRoutine so user only enters it ONCE!
      const daysMap: Record<'weekdays' | 'everyday' | 'weekends', number[]> = {
        weekdays: [1, 2, 3, 4, 5],
        everyday: [1, 2, 3, 4, 5, 6, 0],
        weekends: [6, 0],
      };
      onAddRecurringRoutine({
        title: newTitle.trim(),
        startTime: newStart,
        endTime: newEnd,
        categoryId: newCategoryId,
        priority: newPriority,
        daysOfWeek: daysMap[repeatMode],
        notes: newNotes.trim() || 'Sabit rutin şablonu',
        active: true,
      });
      setRepeatMode('once');
    }

    setNewStart(newEnd);
    setNewEnd(addMinutesToTime(newEnd, 60));
    setNewTitle('');
    setNewNotes('');
    setNewIsAppointment(false);
  };

  const universalHours = useMemo(() => {
    const hrs: string[] = [];
    for (let h = 6; h <= 23; h++) {
      hrs.push(`${String(h).padStart(2, '0')}:00`);
    }
    hrs.push('00:00');
    return hrs;
  }, []);

  const getStatusBadge = (task: ScheduleTask) => {
    const dur = calculateDurationMinutes(task.startTime, task.endTime);
    switch (task.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Onaylandı ({formatMinutesHuman(task.approvedDurationMinutes ?? dur)})
          </span>
        );
      case 'awaiting_approval':
        return (
          <button
            onClick={() =>
              onUpdateTask(task.id, {
                status: 'approved',
                approvedDurationMinutes: dur,
              })
            }
            className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 hover:bg-emerald-600/30 border border-amber-500/50 px-2 py-0.5 text-[11px] font-bold text-amber-300 animate-pulse transition"
            title="Hemen onaylamak için tıklayın"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Onay Bekliyor
          </button>
        );
      case 'postponed':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            Ertelendi (Az Ceza)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/40 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
            İptal / Yapılamadı
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
            <Clock className="h-3 w-3" />
            Planlandı
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
            XLS
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Evrensel Saat Listesi & Puanlı Görev Tablosu</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                {dayTasks.length} Görev
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Sabit mesai ve rutinleriniz her gün otomatik yüklenir • Tek seferlik veya tekrarlı satır ekleyebilirsiniz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Open Recurring Shift & Routines Manager Button */}
          <button
            onClick={() => onOpenRoutinesModal('shifts')}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-500/15 hover:bg-indigo-500/25 px-3 py-1.5 text-xs font-bold text-indigo-300 transition"
            title="Mesai saatlerinizi ve sabit günlük rutinlerinizi tek seferde ayarlayın"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>Sabit Mesai & Rutinler ({recurringRoutinesCount})</span>
          </button>

          {/* Toggle between Flexible Excel Table vs 24h Universal Hour Slots */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'spreadsheet'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Excel Tablosu
            </button>
            <button
              onClick={() => setViewMode('timeline24')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'timeline24'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24 Saat
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Bar (Excel Formula/Input Bar style with Repeat Selector!) */}
      <form
        onSubmit={handleCreateTask}
        className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-slate-800 bg-slate-950/90 p-3 items-center"
      >
        <div className="md:col-span-2 flex items-center gap-1">
          <input
            type="time"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1.5 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
            required
          />
          <span className="text-slate-500 text-xs">-</span>
          <input
            type="time"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1.5 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div className="md:col-span-3">
          <input
            type="text"
            placeholder="Görev, mesai veya randevu adı..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div className="md:col-span-2">
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.pointMultiplier ?? 1}x)
              </option>
            ))}
          </select>
        </div>

        {/* Repeat Frequency Selector: Enter Once, Repeat Forever! */}
        <div className="md:col-span-2">
          <select
            value={repeatMode}
            onChange={(e) =>
              setRepeatMode(
                e.target.value as 'once' | 'weekdays' | 'everyday' | 'weekends'
              )
            }
            className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold focus:outline-none ${
              repeatMode !== 'once'
                ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
            title="Mesai veya rutin ise tekrar sıklığını seçin, bir kez girmeniz yeterli!"
          >
            <option value="once">Tek Seferlik (Sadece Bugün)</option>
            <option value="weekdays">🔄 Hafta İçi Her Gün (Pzt-Cum)</option>
            <option value="everyday">🔄 Her Gün Otomatik (7 Gün)</option>
            <option value="weekends">🔄 Hafta Sonu (Cmt-Paz)</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="low">0.8x</option>
            <option value="medium">1.0x</option>
            <option value="high">1.25x</option>
            <option value="critical">1.5x</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setNewIsAppointment(!newIsAppointment)}
            title="Ajanda Randevusu Olarak İşaretle"
            className={`flex items-center justify-center rounded-lg border p-1.5 text-xs transition ${
              newIsAppointment
                ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="h-4 w-4" />
          </button>

          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>{repeatMode === 'once' ? 'Ekle' : 'Sabitle'}</span>
          </button>
        </div>
      </form>

      {/* Automatically Assigned Daily Quotas & Goals Strip (Water 3L, Reading 30p, etc.) */}
      <div className="border-b border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
            <Droplets className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              Her Güne Otomatik Atanan Sabit Hedefler & Kotalar ({selectedDate})
            </span>
            <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
              • Her hedef tamamlandığında +25 KP & Disiplin Notu verir
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenRoutinesModal('quotas')}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3 w-3" />
            <span>Sabit Günlük Hedef Ekle / Yönet</span>
          </button>
        </div>

        {dayAutoQuotas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Henüz her güne otomatik atanan sabit hedefiniz (Örn: 3 Litre Su, 30 Sayfa Kitap) yok.
            </span>
            <button
              type="button"
              onClick={() => onOpenRoutinesModal('quotas')}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-2 shrink-0"
            >
              1 Kez Tanımla &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {dayAutoQuotas.map((h) => {
              const targetVal = h.dailyTargetValue ?? 1;
              const unit = h.unit || 'Gün';
              const stepVal = h.stepValue ?? 1;
              const isCompleted = h.completedDates.includes(selectedDate);
              const rawProg = h.dailyProgress?.[selectedDate] ?? (isCompleted ? targetVal : 0);
              const currentProg = isCompleted ? targetVal : Math.min(targetVal, rawProg);
              const pct = Math.min(100, Math.round((currentProg / targetVal) * 100));

              return (
                <div
                  key={h.id}
                  className={`rounded-xl border px-3 py-2 flex flex-col justify-between gap-1.5 transition ${
                    isCompleted
                      ? 'border-emerald-500/40 bg-emerald-950/25'
                      : 'border-slate-800 bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isCompleted ? 'text-emerald-300' : 'text-white'
                      }`}
                      title={h.title}
                    >
                      {h.title}
                    </span>
                    <span className="font-mono text-[10px] font-extrabold text-cyan-300 shrink-0">
                      {currentProg} / {targetVal} {unit}
                    </span>
                  </div>

                  {/* Progress bar + Action buttons */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-emerald-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {targetVal > 1 && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => onIncrementHabitProgress(h.id, selectedDate)}
                          className="rounded-md bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-200 transition"
                          title={`+${stepVal} ${unit} ekle`}
                        >
                          +{stepVal}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleHabitDate(h.id, selectedDate)}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition flex items-center gap-0.5 border ${
                          isCompleted
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 hover:bg-emerald-600/30 border-slate-700 text-slate-300 hover:text-emerald-200'
                        }`}
                        title={isCompleted ? 'Tamamlandı (+25 KP) — Geri almak için tıkla' : 'Tamamlandı işaretle (+25 KP)'}
                      >
                        <Check className="h-3 w-3" />
                        <span>{isCompleted ? '+25 KP' : 'Bitir'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'spreadsheet' ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-2 border-r border-slate-800/80 w-8 text-center">#</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/80 w-32">Saat Aralığı</th>
                <th className="py-2.5 px-2 border-r border-slate-800/80 w-16 text-center">Süre</th>
                <th className="py-2.5 px-3 border-r border-slate-800/80">Görev / Mesai / Rutin</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/80 w-36">Kategori & Öncelik</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/80 w-28 text-center">Puan (KP)</th>
                <th className="py-2.5 px-2.5 border-r border-slate-800/80 w-36">Onay Durumu</th>
                <th className="py-2.5 px-2 w-32 text-center">Karar / İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {dayTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Bu gün için henüz zaman bloğu eklenmemiş. Yukarıdaki satırdan hemen bir görev veya sabit mesai ekleyin.
                  </td>
                </tr>
              ) : (
                dayTasks.map((task, idx) => {
                  const category =
                    categories.find((c) => c.id === task.categoryId) || categories[0];
                  const duration = calculateDurationMinutes(task.startTime, task.endTime);
                  const pt = calculateTaskPointBreakdown(task, categories);
                  const isCurrentlyActive =
                    selectedDate === todayStr &&
                    currentTimeHHMM >= task.startTime &&
                    currentTimeHHMM < task.endTime;

                  return (
                    <tr
                      key={task.id}
                      className={`group transition ${
                        isCurrentlyActive
                          ? 'bg-indigo-950/40 hover:bg-indigo-950/60'
                          : task.status === 'awaiting_approval'
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : task.status === 'approved'
                          ? 'bg-emerald-950/10 hover:bg-slate-800/50'
                          : task.status === 'cancelled'
                          ? 'bg-rose-950/15 hover:bg-rose-950/25'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Row Number */}
                      <td className="py-2 px-2 border-r border-slate-800/60 text-center font-mono text-slate-500">
                        {isCurrentlyActive ? (
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400 animate-ping" />
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* Editable Time Range Cell */}
                      <td className="py-2 px-2 border-r border-slate-800/60 font-mono">
                        <div className="flex items-center gap-0.5">
                          <input
                            type="time"
                            value={task.startTime}
                            onChange={(e) =>
                              onUpdateTask(task.id, { startTime: e.target.value })
                            }
                            className="bg-transparent text-slate-200 hover:bg-slate-800 rounded px-1 py-0.5 focus:bg-slate-900 focus:outline-none w-[58px]"
                          />
                          <span className="text-slate-600">-</span>
                          <input
                            type="time"
                            value={task.endTime}
                            onChange={(e) =>
                              onUpdateTask(task.id, { endTime: e.target.value })
                            }
                            className="bg-transparent text-slate-200 hover:bg-slate-800 rounded px-1 py-0.5 focus:bg-slate-900 focus:outline-none w-[58px]"
                          />
                        </div>
                      </td>

                      {/* Calculated Duration Cell */}
                      <td className="py-2 px-2 border-r border-slate-800/60 text-center font-mono text-slate-300 font-semibold">
                        {formatMinutesHuman(duration)}
                      </td>

                      {/* Editable Title & Note Cell */}
                      <td className="py-2 px-3 border-r border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          {task.routineTemplateId && (
                            <span
                              onClick={() => onOpenRoutinesModal('shifts')}
                              title="Sabit Mesai / Günlük Rutin Şablonundan Otomatik Geldi (Düzenlemek için tıklayın)"
                              className="inline-flex items-center gap-0.5 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30 shrink-0 cursor-pointer hover:bg-indigo-500/30"
                            >
                              <Repeat className="h-2.5 w-2.5" />
                              Sabit
                            </span>
                          )}
                          {task.isAppointment && (
                            <span
                              title="Ajanda Randevusu"
                              className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 shrink-0"
                            >
                              <MapPin className="h-2.5 w-2.5" />
                              Randevu
                            </span>
                          )}
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) =>
                              onUpdateTask(task.id, { title: e.target.value })
                            }
                            className={`w-full bg-transparent font-semibold focus:bg-slate-900 focus:px-2 focus:py-0.5 rounded focus:outline-none ${
                              task.status === 'cancelled'
                                ? 'line-through text-slate-500'
                                : 'text-white'
                            }`}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Not ekle..."
                          value={task.notes}
                          onChange={(e) =>
                            onUpdateTask(task.id, { notes: e.target.value })
                          }
                          className="w-full bg-transparent text-[11px] text-slate-400 placeholder-slate-600 focus:text-slate-200 focus:bg-slate-900 rounded px-1 py-0.2 focus:outline-none mt-0.5"
                        />
                      </td>

                      {/* Category & Priority Multiplier Cell */}
                      <td className="py-2 px-2 border-r border-slate-800/60 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <select
                            value={task.categoryId}
                            onChange={(e) =>
                              onUpdateTask(task.id, { categoryId: e.target.value })
                            }
                            className="w-full bg-transparent text-slate-200 focus:bg-slate-900 rounded px-1 py-0.2 focus:outline-none text-[11px] font-medium"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id} className="bg-slate-900">
                                {c.name} ({c.pointMultiplier ?? 1}x)
                              </option>
                            ))}
                          </select>
                        </div>
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            onUpdateTask(task.id, {
                              priority: e.target.value as PriorityLevel,
                            })
                          }
                          className="w-full bg-slate-950/60 text-slate-400 rounded px-1.5 py-0.5 text-[10px] border border-slate-800 focus:outline-none"
                        >
                          {Object.entries(PRIORITY_LABELS).map(([k, label]) => (
                            <option key={k} value={k} className="bg-slate-900">
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Live Point (KP) Column */}
                      <td className="py-2 px-2 border-r border-slate-800/60 text-center font-mono">
                        {task.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-extrabold text-emerald-300">
                            +{pt.rewardPoints} KP
                          </span>
                        ) : task.status === 'postponed' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-extrabold text-amber-300">
                            {pt.postponePenalty} KP
                          </span>
                        ) : task.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-extrabold text-rose-400">
                            {pt.cancelPenalty} KP
                          </span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-indigo-300">
                              +{pt.rewardPoints} KP
                            </span>
                            <span className="text-[9px] text-slate-500">
                              İptal: {pt.cancelPenalty}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Approval Status Cell */}
                      <td className="py-2 px-2 border-r border-slate-800/60">
                        {getStatusBadge(task)}
                      </td>

                      {/* Quick Decision / Action Buttons */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              onUpdateTask(task.id, {
                                status: 'approved',
                                approvedDurationMinutes: duration,
                              })
                            }
                            title={`Onayla (+${pt.rewardPoints} KP Kazan)`}
                            className={`rounded-md p-1.5 transition ${
                              task.status === 'approved'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              onUpdateTask(task.id, { status: 'postponed' })
                            }
                            title={`Ertele (${pt.postponePenalty} KP hafif kesinti)`}
                            className={`rounded-md p-1.5 transition ${
                              task.status === 'postponed'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-400'
                            }`}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              onUpdateTask(task.id, { status: 'cancelled' })
                            }
                            title={`Yapılamadı / İptal (${pt.cancelPenalty} KP Ceza)`}
                            className={`rounded-md p-1.5 transition ${
                              task.status === 'cancelled'
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-400'
                            }`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onStartPomodoroForTask(task)}
                            title="Bu görev için odak sayacını başlat"
                            className="rounded-md bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 p-1.5 transition"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Bu Günden Kaldır"
                            className="rounded-md hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 p-1.5 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* Universal Top-to-Bottom Hour List (06:00 -> 00:00) */
          <div className="divide-y divide-slate-800/70">
            {universalHours.map((hourStr) => {
              const prefix = hourStr.slice(0, 2);
              const matchingTasks = dayTasks.filter(
                (t) =>
                  t.startTime.startsWith(prefix) ||
                  (t.startTime < hourStr && t.endTime > hourStr)
              );

              return (
                <div
                  key={hourStr}
                  className="grid grid-cols-12 min-h-[52px] hover:bg-slate-800/30 transition"
                >
                  <div className="col-span-2 sm:col-span-1 border-r border-slate-800/80 flex items-center justify-center font-mono text-xs font-semibold text-slate-400 bg-slate-950/40">
                    {hourStr}
                  </div>
                  <div className="col-span-10 sm:col-span-11 p-2 flex flex-wrap items-center gap-2">
                    {matchingTasks.length === 0 ? (
                      <button
                        onClick={() => {
                          setNewStart(hourStr);
                          setNewEnd(addMinutesToTime(hourStr, 60));
                          setViewMode('spreadsheet');
                        }}
                        className="text-[11px] text-slate-600 hover:text-indigo-400 transition"
                      >
                        + {hourStr} dilimine görev ata
                      </button>
                    ) : (
                      matchingTasks.map((t) => {
                        const cat =
                          categories.find((c) => c.id === t.categoryId) || categories[0];
                        const pt = calculateTaskPointBreakdown(t, categories);
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs w-full sm:w-auto flex-1"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              borderColor: `${cat.color}50`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">
                                {t.startTime} - {t.endTime}
                              </span>
                              {t.routineTemplateId && (
                                <span className="rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-bold text-indigo-200">
                                  🔄 Sabit
                                </span>
                              )}
                              <span className="font-semibold text-slate-100">{t.title}</span>
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${cat.color}30`,
                                  color: cat.color,
                                }}
                              >
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-300">
                                +{pt.rewardPoints} KP
                              </span>
                              {getStatusBadge(t)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
