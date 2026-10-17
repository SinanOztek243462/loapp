import React, { useState, useEffect } from 'react';
import { Category, RecurringRoutine, PriorityLevel, Habit } from '../types';
import { WEEKDAY_OPTIONS, calculateDurationMinutes, formatMinutesHuman } from '../utils/helpers';
import {
  Repeat,
  Plus,
  Trash2,
  X,
  Briefcase,
  CalendarCheck,
  Power,
  Droplets,
  Target,
} from 'lucide-react';

interface RecurringRoutinesModalProps {
  isOpen: boolean;
  initialTab?: 'shifts' | 'quotas';
  onClose: () => void;
  routines: RecurringRoutine[];
  habits: Habit[];
  categories: Category[];
  onAddRoutine: (routine: Omit<RecurringRoutine, 'id'>) => void;
  onUpdateRoutine: (id: string, updates: Partial<RecurringRoutine>) => void;
  onDeleteRoutine: (id: string) => void;
  onAddHabitQuota: (habit: Omit<Habit, 'id'>) => void;
  onUpdateHabitQuota: (id: string, updates: Partial<Habit>) => void;
  onDeleteHabitQuota: (id: string) => void;
}

export const RecurringRoutinesModal: React.FC<RecurringRoutinesModalProps> = ({
  isOpen,
  initialTab = 'shifts',
  onClose,
  routines,
  habits,
  categories,
  onAddRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onAddHabitQuota,
  onUpdateHabitQuota,
  onDeleteHabitQuota,
}) => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'quotas'>(initialTab);

  // Tab 1: Timed Shift / Routine Form States
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-work');
  const [priority, setPriority] = useState<PriorityLevel>('critical');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState('');

  // Tab 2: All-Day Recurring Daily Quota / Goal Form States (Su, Kitap, Vitamin vb.)
  const [quotaTitle, setQuotaTitle] = useState('');
  const [quotaCategoryId, setQuotaCategoryId] = useState('cat-health');
  const [quotaTargetValue, setQuotaTargetValue] = useState<number>(3);
  const [quotaUnit, setQuotaUnit] = useState('Litre');
  const [quotaStepValue, setQuotaStepValue] = useState<number>(0.5);
  const [quotaDaysOfWeek, setQuotaDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const toggleDayInForm = (dayNum: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const toggleQuotaDayInForm = (dayNum: number) => {
    setQuotaDaysOfWeek((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const toggleDayInExistingRoutine = (routine: RecurringRoutine, dayNum: number) => {
    const exists = routine.daysOfWeek.includes(dayNum);
    const nextDays = exists
      ? routine.daysOfWeek.filter((d) => d !== dayNum)
      : [...routine.daysOfWeek, dayNum];
    onUpdateRoutine(routine.id, { daysOfWeek: nextDays });
  };

  const toggleDayInExistingHabit = (habit: Habit, dayNum: number) => {
    const currentDays = habit.daysOfWeek || [1, 2, 3, 4, 5, 6, 0];
    const exists = currentDays.includes(dayNum);
    const nextDays = exists
      ? currentDays.filter((d) => d !== dayNum)
      : [...currentDays, dayNum];
    onUpdateHabitQuota(habit.id, {
      daysOfWeek: nextDays,
      targetDaysPerWeek: nextDays.length,
    });
  };

  const handleSubmitRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || daysOfWeek.length === 0) return;

    onAddRoutine({
      title: title.trim(),
      startTime,
      endTime,
      categoryId,
      priority,
      daysOfWeek,
      notes: notes.trim() || 'Sabit rutin şablonu',
      active: true,
    });

    setTitle('');
    setNotes('');
  };

  const handleSubmitQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaTitle.trim() || quotaDaysOfWeek.length === 0) return;

    onAddHabitQuota({
      title: quotaTitle.trim(),
      categoryId: quotaCategoryId,
      targetDaysPerWeek: quotaDaysOfWeek.length,
      daysOfWeek: quotaDaysOfWeek,
      dailyTargetValue: Math.max(0.1, Number(quotaTargetValue) || 1),
      unit: quotaUnit.trim() || 'Adet',
      stepValue: Math.max(0.1, Number(quotaStepValue) || 1),
      dailyProgress: {},
      completedDates: [],
      active: true,
    });

    setQuotaTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Sabit Mesai, Günlük Rutinler & Her Güne Atanan Kotalar (1 Kez Tanımla)
              </h2>
              <p className="text-xs text-slate-400">
                Mesai saatlerinizi ve günlük su/kitap/beslenme gibi tekrarlayan hedeflerinizi 1 kez girin, her güne otomatik atansın.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-extrabold border-t border-x transition ${
              activeTab === 'shifts'
                ? 'border-indigo-500/50 bg-slate-900 text-indigo-300'
                : 'border-transparent bg-slate-950/50 text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>⏰ Saatli Sabit Mesai & Rutinler ({routines.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotas')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-extrabold border-t border-x transition ${
              activeTab === 'quotas'
                ? 'border-cyan-500/50 bg-slate-900 text-cyan-300'
                : 'border-transparent bg-slate-950/50 text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="h-4 w-4 text-cyan-400" />
            <span>💧 Her Güne Otomatik Atanan Sabit Hedefler (Su, Kitap vb.) ({habits.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'shifts' ? (
            <>
              {/* TAB 1: Add New Recurring Shift / Routine Form */}
              <form
                onSubmit={handleSubmitRoutine}
                className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-4 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>+ Yeni Saatli Mesai / Günlük Rutin Tanımla (Excel Tablosuna Otomatik Düşer)</span>
                  </span>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Hızlı Gün Seçimi:</span>
                    <button
                      type="button"
                      onClick={() => setDaysOfWeek([1, 2, 3, 4, 5])}
                      className="rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 px-2 py-0.5 text-indigo-300 font-semibold transition"
                    >
                      Hafta İçi (Pzt-Cum)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysOfWeek([1, 2, 3, 4, 5, 6, 0])}
                      className="rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2 py-0.5 text-emerald-300 font-semibold transition"
                    >
                      Her Gün (7 Gün)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysOfWeek([6, 0])}
                      className="rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2 py-0.5 text-amber-300 font-semibold transition"
                    >
                      Hafta Sonu (Cmt-Paz)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                  <div className="md:col-span-3 flex items-center gap-1.5">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 font-mono text-xs text-white"
                      required
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 font-mono text-xs text-white"
                      required
                    />
                  </div>

                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Örn: Mesai Saatleri, Sabah Hazırlık, Antrenman..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.pointMultiplier ?? 1}x)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white"
                    >
                      <option value="low">Düşük (0.8x)</option>
                      <option value="medium">Normal (1.0x)</option>
                      <option value="high">Yüksek (1.25x)</option>
                      <option value="critical">Kritik (1.5x)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">Geçerli Günler:</span>
                    {WEEKDAY_OPTIONS.map((w) => {
                      const active = daysOfWeek.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleDayInForm(w.day)}
                          className={`h-8 w-10 rounded-lg font-bold text-xs transition border ${
                            active
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {w.short}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/20 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Saatli Rutin Olarak Kaydet</span>
                  </button>
                </div>
              </form>

              {/* Existing Recurring Routines List */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-emerald-400" />
                  <span>Kayıtlı Saatli Mesai & Günlük Rutinleriniz ({routines.length})</span>
                </h3>

                {routines.map((routine) => {
                  const cat =
                    categories.find((c) => c.id === routine.categoryId) || categories[0];
                  const dur = calculateDurationMinutes(routine.startTime, routine.endTime);

                  return (
                    <div
                      key={routine.id}
                      className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 transition ${
                        routine.active
                          ? 'border-slate-800 bg-slate-950/80'
                          : 'border-slate-800/50 bg-slate-950/30 opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
                        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-xs">
                          <input
                            type="time"
                            value={routine.startTime}
                            onChange={(e) =>
                              onUpdateRoutine(routine.id, { startTime: e.target.value })
                            }
                            className="bg-transparent text-indigo-300 font-bold focus:outline-none w-[58px]"
                          />
                          <span className="text-slate-600">-</span>
                          <input
                            type="time"
                            value={routine.endTime}
                            onChange={(e) =>
                              onUpdateRoutine(routine.id, { endTime: e.target.value })
                            }
                            className="bg-transparent text-indigo-300 font-bold focus:outline-none w-[58px]"
                          />
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({formatMinutesHuman(dur)})
                          </span>
                        </div>

                        <div className="flex-1 min-w-[180px]">
                          <input
                            type="text"
                            value={routine.title}
                            onChange={(e) =>
                              onUpdateRoutine(routine.id, { title: e.target.value })
                            }
                            className="w-full bg-transparent text-sm font-extrabold text-white focus:bg-slate-900 rounded px-1.5 py-0.5 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 mt-0.5 px-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-[11px] text-slate-400">{cat.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {WEEKDAY_OPTIONS.map((w) => {
                          const isDayOn = routine.daysOfWeek.includes(w.day);
                          return (
                            <button
                              key={w.day}
                              onClick={() => toggleDayInExistingRoutine(routine, w.day)}
                              className={`h-7 w-8 rounded-md font-bold text-[11px] transition border ${
                                isDayOn
                                  ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                              }`}
                              title={`${w.label} günü otomatik eklensin mi?`}
                            >
                              {w.short}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateRoutine(routine.id, { active: !routine.active })
                          }
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                            routine.active
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{routine.active ? 'Aktif' : 'İzinli / Duraklatıldı'}</span>
                        </button>

                        <button
                          onClick={() => onDeleteRoutine(routine.id)}
                          className="rounded-lg border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/15 p-2 text-slate-500 hover:text-rose-400 transition"
                          title="Sabit Rutini Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* TAB 2: All-Day Recurring Daily Quotas & Goals (Water, Reading, Vitamin, Steps etc.) */}
              <form
                onSubmit={handleSubmitQuota}
                className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    <span>+ Yeni Günlük Tekrarlayan Hedef / Kota Tanımla (Her Güne Otomatik Atanır)</span>
                  </span>

                  {/* Quick Templates */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Hızlı Şablon:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuotaTitle('💧 Günlük Su Tüketimi');
                        setQuotaTargetValue(3);
                        setQuotaUnit('Litre');
                        setQuotaStepValue(0.5);
                        setQuotaCategoryId('cat-health');
                      }}
                      className="rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-2 py-0.5 text-cyan-300 font-semibold transition"
                    >
                      💧 3 Litre Su
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuotaTitle('📖 Günlük Kitap Okuma');
                        setQuotaTargetValue(30);
                        setQuotaUnit('Sayfa');
                        setQuotaStepValue(10);
                        setQuotaCategoryId('cat-study');
                      }}
                      className="rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 px-2 py-0.5 text-indigo-300 font-semibold transition"
                    >
                      📖 30 Sayfa Kitap
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuotaTitle('💊 Günlük Vitamin & Takviye');
                        setQuotaTargetValue(1);
                        setQuotaUnit('Doz');
                        setQuotaStepValue(1);
                        setQuotaCategoryId('cat-health');
                      }}
                      className="rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2 py-0.5 text-emerald-300 font-semibold transition"
                    >
                      💊 Günlük Vitamin
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                  <div className="md:col-span-4">
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Hedef Başlığı
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 💧 Günlük Su Tüketimi, 📖 Kitap Oku..."
                      value={quotaTitle}
                      onChange={(e) => setQuotaTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Günlük Hedef Miktar
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quotaTargetValue}
                      onChange={(e) => setQuotaTargetValue(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-white"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Birim (Litre/Sayfa/Gün)
                    </label>
                    <input
                      type="text"
                      placeholder="Litre, Sayfa, Adet..."
                      value={quotaUnit}
                      onChange={(e) => setQuotaUnit(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Artış Adımı (+ Butonu)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quotaStepValue}
                      onChange={(e) => setQuotaStepValue(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-white"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Kategori
                    </label>
                    <select
                      value={quotaCategoryId}
                      onChange={(e) => setQuotaCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">Atanacağı Günler:</span>
                    {WEEKDAY_OPTIONS.map((w) => {
                      const active = quotaDaysOfWeek.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleQuotaDayInForm(w.day)}
                          className={`h-8 w-10 rounded-lg font-bold text-xs transition border ${
                            active
                              ? 'bg-cyan-600 border-cyan-400 text-white shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {w.short}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-cyan-600/20 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Her Güne Otomatik Ata</span>
                  </button>
                </div>
              </form>

              {/* Existing All-Day Recurring Daily Goals List */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <span>Her Güne Otomatik Atanan Sabit Hedef & Kotalarınız ({habits.length})</span>
                </h3>

                {habits.map((habit) => {
                  const cat =
                    categories.find((c) => c.id === habit.categoryId) || categories[0];
                  const activeDays = habit.daysOfWeek || [1, 2, 3, 4, 5, 6, 0];
                  const isActive = habit.active !== false;

                  return (
                    <div
                      key={habit.id}
                      className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 transition ${
                        isActive
                          ? 'border-slate-800 bg-slate-950/80'
                          : 'border-slate-800/50 bg-slate-950/30 opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
                        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-1.5 font-mono text-xs text-cyan-300">
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            value={habit.dailyTargetValue ?? 1}
                            onChange={(e) =>
                              onUpdateHabitQuota(habit.id, {
                                dailyTargetValue: Math.max(0.1, Number(e.target.value) || 1),
                              })
                            }
                            className="bg-transparent font-extrabold text-cyan-300 w-14 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={habit.unit || 'Gün'}
                            onChange={(e) =>
                              onUpdateHabitQuota(habit.id, { unit: e.target.value })
                            }
                            className="bg-transparent text-cyan-200 w-14 focus:outline-none text-xs"
                          />
                        </div>

                        <div className="flex-1 min-w-[180px]">
                          <input
                            type="text"
                            value={habit.title}
                            onChange={(e) =>
                              onUpdateHabitQuota(habit.id, { title: e.target.value })
                            }
                            className="w-full bg-transparent text-sm font-extrabold text-white focus:bg-slate-900 rounded px-1.5 py-0.5 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 mt-0.5 px-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-[11px] text-slate-400">
                              {cat.name} • Tamamlandığında +25 KP & Disiplin Bonusu
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {WEEKDAY_OPTIONS.map((w) => {
                          const isDayOn = activeDays.includes(w.day);
                          return (
                            <button
                              key={w.day}
                              onClick={() => toggleDayInExistingHabit(habit, w.day)}
                              className={`h-7 w-8 rounded-md font-bold text-[11px] transition border ${
                                isDayOn
                                  ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                              }`}
                              title={`${w.label} günü otomatik atansın mı?`}
                            >
                              {w.short}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateHabitQuota(habit.id, { active: !isActive })
                          }
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                            isActive
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{isActive ? 'Aktif' : 'Duraklatıldı'}</span>
                        </button>

                        <button
                          onClick={() => onDeleteHabitQuota(habit.id)}
                          className="rounded-lg border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/15 p-2 text-slate-500 hover:text-rose-400 transition"
                          title="Sabit Günlük Hedefi Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-3.5 text-xs text-slate-400">
          <span>
            💡 İpucu: Günlük su tüketimi (3 Litre), kitap okuma gibi hedefler ajandaya tek tek yazılmaz; burada 1 kez tanımlanır ve her günün ekranına otomatik atanır.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-extrabold text-white transition"
          >
            Tamam & Tabloya Dön
          </button>
        </div>
      </div>
    </div>
  );
};
