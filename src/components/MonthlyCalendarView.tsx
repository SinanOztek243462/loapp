import React, { useState, useMemo } from 'react';
import { Category, ScheduleTask, DayAgendaNote, Habit } from '../types';
import { formatDateISO } from '../utils/helpers';
import { calculateDailyDiscipline, calculateTaskPointBreakdown } from '../utils/scoring';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  FileText,
  ArrowUpRight,
  Plus,
  Trophy,
  Droplets,
  Check,
} from 'lucide-react';

interface MonthlyCalendarViewProps {
  currentDate: string; // YYYY-MM-DD
  todayStr: string;
  tasks: ScheduleTask[];
  habits: Habit[];
  categories: Category[];
  dayNotes: Record<string, DayAgendaNote>;
  onSelectDateAndEnterDay: (dateStr: string) => void;
  onUpdateDayNote: (dateStr: string, note: string, highlights: string[]) => void;
  onAddTask: (task: Omit<ScheduleTask, 'id'>) => void;
  onIncrementHabitProgress: (habitId: string, dateStr: string) => void;
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onOpenRoutinesModal: (tab?: 'shifts' | 'quotas') => void;
}

const TURKISH_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  currentDate,
  todayStr,
  tasks,
  habits,
  categories,
  dayNotes,
  onSelectDateAndEnterDay,
  onUpdateDayNote,
  onAddTask,
  onIncrementHabitProgress,
  onToggleHabitDate,
  onOpenRoutinesModal,
}) => {
  const initialDateObj = new Date(currentDate + 'T12:00:00');
  const [viewYear, setViewYear] = useState(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDateObj.getMonth());

  const [previewDate, setPreviewDate] = useState<string>(currentDate);

  const [quickTitle, setQuickTitle] = useState('');
  const [quickStart, setQuickStart] = useState('10:00');
  const [quickEnd, setQuickEnd] = useState('11:00');
  const [quickCatId, setQuickCatId] = useState('cat-errands');
  const [quickLocation, setQuickLocation] = useState('');
  const [newHighlight, setNewHighlight] = useState('');

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }[] = [];

    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      cells.push({
        dateStr: formatDateISO(d),
        dayNum: d.getDate(),
        isCurrentMonth: false,
      });
    }

    for (let dNum = 1; dNum <= totalDays; dNum++) {
      const d = new Date(viewYear, viewMonth, dNum);
      cells.push({
        dateStr: formatDateISO(d),
        dayNum: dNum,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      cells.push({
        dateStr: formatDateISO(d),
        dayNum: d.getDate(),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const previewDayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date === previewDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, previewDate]);

  const previewDiscipline = useMemo(() => {
    return calculateDailyDiscipline(previewDate, tasks, habits, categories);
  }, [previewDate, tasks, habits, categories]);

  const currentPreviewNote = dayNotes[previewDate] || {
    date: previewDate,
    summaryNote: '',
    highlights: [],
  };

  const handleAddQuickAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask({
      date: previewDate,
      startTime: quickStart,
      endTime: quickEnd,
      title: quickTitle.trim(),
      categoryId: quickCatId,
      priority: 'high',
      status: 'planned',
      notes: quickLocation ? `Konum: ${quickLocation}` : 'Aylık ajandadan eklendi',
      isAppointment: true,
      location: quickLocation.trim(),
    });
    setQuickTitle('');
    setQuickLocation('');
  };

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlight.trim()) return;
    onUpdateDayNote(previewDate, currentPreviewNote.summaryNote, [
      ...currentPreviewNote.highlights,
      newHighlight.trim(),
    ]);
    setNewHighlight('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Left 8 Columns: Monthly Interactive Calendar Grid */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {TURKISH_MONTHS[viewMonth]} {viewYear}
              </h2>
              <p className="text-xs text-slate-400">
                Her günün kutusunda <strong>Disiplin Harf Notu (S/A/B/C) ve Kazanılan KP</strong> görünür •{' '}
                <strong>Tek tık:</strong> Sağda Ajanda • <strong>Çift tık:</strong> Güne Gir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const t = new Date(todayStr + 'T12:00:00');
                setViewYear(t.getFullYear());
                setViewMonth(t.getMonth());
                setPreviewDate(todayStr);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              Bugüne Dön
            </button>
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5">
              <button
                onClick={handlePrevMonth}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title="Önceki Ay"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title="Sonraki Ay"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/70 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 border-r border-slate-800/50 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 6x7 Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-800/60 bg-slate-950/30">
          {calendarDays.map((cell) => {
            const cellTasks = tasks.filter((t) => t.date === cell.dateStr);
            const cellNote = dayNotes[cell.dateStr];
            const isToday = cell.dateStr === todayStr;
            const isSelectedPreview = cell.dateStr === previewDate;
            const appointments = cellTasks.filter((t) => t.isAppointment);
            const disc = calculateDailyDiscipline(
              cell.dateStr,
              tasks,
              habits,
              categories
            );

            return (
              <div
                key={cell.dateStr}
                onClick={() => setPreviewDate(cell.dateStr)}
                onDoubleClick={() => onSelectDateAndEnterDay(cell.dateStr)}
                className={`p-2 flex flex-col justify-between cursor-pointer transition relative select-none ${
                  !cell.isCurrentMonth ? 'opacity-35 bg-slate-950/80' : ''
                } ${
                  isSelectedPreview
                    ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-950/30'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Top row: Day number + Discipline Grade Badge */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40'
                        : isSelectedPreview
                        ? 'text-indigo-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  <div className="flex items-center gap-1">
                    {disc.hasActivity && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-mono font-extrabold border"
                        style={{
                          backgroundColor: `${disc.gradeColor}20`,
                          color: disc.gradeColor,
                          borderColor: `${disc.gradeColor}50`,
                        }}
                        title={`Disiplin Notu: ${disc.score100}/100 (${disc.letterGrade}) • Net Puan: ${disc.netPoints} KP`}
                      >
                        {disc.letterGrade} • {disc.score100}p
                      </span>
                    )}
                    {cellNote?.summaryNote && (
                      <span
                        title={cellNote.summaryNote}
                        className="h-2 w-2 rounded-full bg-amber-400 shrink-0"
                      />
                    )}
                  </div>
                </div>

                {/* Middle: Show appointment badges or note snippet directly on calendar cell */}
                <div className="my-1 space-y-1 overflow-hidden">
                  {appointments.slice(0, 2).map((app) => (
                    <div
                      key={app.id}
                      className="truncate rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-200 flex items-center gap-1"
                    >
                      <MapPin className="h-2.5 w-2.5 shrink-0 text-amber-400" />
                      <span className="font-mono">{app.startTime}</span>
                      <span className="truncate">{app.title}</span>
                    </div>
                  ))}

                  {cellNote?.highlights?.slice(0, 1).map((hl, i) => (
                    <div
                      key={i}
                      className="truncate rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300"
                    >
                      • {hl}
                    </div>
                  ))}
                </div>

                {/* Bottom: Net KP + Category mini color bar */}
                <div className="space-y-1">
                  {disc.hasActivity && disc.netPoints !== 0 && (
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-500">{cellTasks.length} görev</span>
                      <span
                        className={
                          disc.netPoints >= 0
                            ? 'text-emerald-400 font-bold'
                            : 'text-rose-400 font-bold'
                        }
                      >
                        {disc.netPoints >= 0 ? `+${disc.netPoints}` : disc.netPoints} KP
                      </span>
                    </div>
                  )}
                  {cellTasks.length > 0 && (
                    <div className="flex h-1 w-full gap-0.5 overflow-hidden rounded-full bg-slate-800">
                      {cellTasks.slice(0, 5).map((t) => {
                        const c = categories.find((cat) => cat.id === t.categoryId);
                        return (
                          <div
                            key={t.id}
                            className="h-full flex-1"
                            style={{ backgroundColor: c?.color || '#6366f1' }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 4 Columns: Day Agenda, Discipline Report Card & Note Preview Drawer */}
      <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Seçili Gün Ajanda & Karne Önizlemesi
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5 font-mono">
              {previewDate}
            </h3>
          </div>

          <button
            onClick={() => onSelectDateAndEnterDay(previewDate)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition"
          >
            <span>Günün İçine Gir</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Daily Discipline Grade & Score Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl border"
              style={{
                backgroundColor: `${previewDiscipline.gradeColor}20`,
                color: previewDiscipline.gradeColor,
                borderColor: `${previewDiscipline.gradeColor}50`,
              }}
            >
              {previewDiscipline.letterGrade}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Günlük Disiplin Notu
              </span>
              <span className="text-sm font-extrabold text-white">
                {previewDiscipline.score100} / 100 Puan
              </span>
              <span className="block text-[11px] text-slate-400">
                {previewDiscipline.approvedCount} / {previewDiscipline.totalTasksCount} görev onaylandı
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">NET KAZANIM</span>
            <span
              className={`text-base font-extrabold ${
                previewDiscipline.netPoints >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {previewDiscipline.netPoints >= 0
                ? `+${previewDiscipline.netPoints}`
                : previewDiscipline.netPoints}{' '}
              KP
            </span>
            {previewDiscipline.penaltyPoints < 0 && (
              <span className="block text-[10px] text-rose-400">
                Ceza: {previewDiscipline.penaltyPoints} KP
              </span>
            )}
          </div>
        </div>

        {/* Automatically Assigned Daily Quotas & Goals for Previewed Day */}
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Droplets className="h-3.5 w-3.5 text-cyan-400" />
              <span>Otomatik Günlük Hedefler (Her Güne Atanır)</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenRoutinesModal('quotas')}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-200 underline"
            >
              + Düzenle
            </button>
          </div>

          <div className="space-y-1.5">
            {habits
              .filter((h) => {
                if (h.active === false) return false;
                const dow = new Date(previewDate + 'T12:00:00').getDay();
                return (h.daysOfWeek || [1, 2, 3, 4, 5, 6, 0]).includes(dow);
              })
              .map((h) => {
                const targetVal = h.dailyTargetValue ?? 1;
                const unit = h.unit || 'Gün';
                const stepVal = h.stepValue ?? 1;
                const isDone = h.completedDates.includes(previewDate);
                const rawProg =
                  h.dailyProgress?.[previewDate] ?? (isDone ? targetVal : 0);
                const currentProg = isDone ? targetVal : Math.min(targetVal, rawProg);

                return (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                      isDone
                        ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/80 text-slate-200'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-semibold">{h.title}</span>
                      <span className="ml-1.5 font-mono text-[10px] text-cyan-300">
                        ({currentProg}/{targetVal} {unit})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {targetVal > 1 && !isDone && (
                        <button
                          type="button"
                          onClick={() => onIncrementHabitProgress(h.id, previewDate)}
                          className="rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-200"
                        >
                          +{stepVal}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleHabitDate(h.id, previewDate)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5 border ${
                          isDone
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 hover:bg-emerald-600/30 border-slate-700 text-slate-300'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        <span>{isDone ? '+25 KP' : 'Tamamla'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Daily Agenda Note Box (Strictly Date-Specific Notes & Reminders) */}
        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>Bu Güne Özel Ajanda Notu & Hatırlatmalar</span>
          </label>
          <textarea
            rows={2}
            placeholder="Sadece bu tarihe özel randevu detayı, gidilecek yer veya hatırlatmaları yazın..."
            value={currentPreviewNote.summaryNote}
            onChange={(e) =>
              onUpdateDayNote(previewDate, e.target.value, currentPreviewNote.highlights)
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950/90 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {currentPreviewNote.highlights.map((hl, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-medium text-amber-200"
              >
                <span>📌 {hl}</span>
                <button
                  onClick={() => {
                    const updated = currentPreviewNote.highlights.filter((_, i) => i !== index);
                    onUpdateDayNote(previewDate, currentPreviewNote.summaryNote, updated);
                  }}
                  className="text-amber-400 hover:text-white ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddHighlight} className="mt-2 flex gap-1.5">
            <input
              type="text"
              placeholder="Bu güne özel madde ekle (Örn: Tahlil sonucu al)..."
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              + Not
            </button>
          </form>
        </div>

        {/* Scheduled Tasks & Appointments List for Previewed Day */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">
              Zamanlanmış Randevu & Görevler ({previewDayTasks.length})
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-48">
            {previewDayTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                Bu günde henüz saatli bir randevu veya görev yok. Aşağıdan hemen ekleyebilirsiniz.
              </div>
            ) : (
              previewDayTasks.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId) || categories[0];
                const pt = calculateTaskPointBreakdown(t, categories);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {t.startTime} - {t.endTime}
                        </span>
                        {t.isAppointment && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                            Randevu
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-0.5">{t.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-semibold block"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        {cat.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-emerald-400">
                        +{pt.rewardPoints} KP
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Appointment / Task Creator directly from Monthly Preview */}
          <form
            onSubmit={handleAddQuickAppointment}
            className="mt-3 pt-3 border-t border-slate-800 space-y-2"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              + Bu Güne Hızlı Randevu / Görev Planla
            </span>
            <input
              type="text"
              placeholder="Örn: Hastane Randevusu / Toplantı..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={quickStart}
                  onChange={(e) => setQuickStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-xs text-white"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="time"
                  value={quickEnd}
                  onChange={(e) => setQuickEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-xs text-white"
                />
              </div>
              <select
                value={quickCatId}
                onChange={(e) => setQuickCatId(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold py-2 text-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Zaman Aralığıyla Takvime Ekle</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
