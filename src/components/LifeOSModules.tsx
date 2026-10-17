import React, { useState } from 'react';
import { Habit, FinanceEntry, LifeGoal, Category } from '../types';
import {
  Flame,
  Target,
  Wallet,
  Plus,
  Check,
  TrendingUp,
  TrendingDown,
  Award,
  Trash2,
} from 'lucide-react';

interface LifeOSModulesProps {
  selectedDate: string;
  habits: Habit[];
  finance: FinanceEntry[];
  goals: LifeGoal[];
  categories: Category[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onAddHabit: (title: string, categoryId: string, targetDays: number) => void;
  onAddFinance: (entry: Omit<FinanceEntry, 'id'>) => void;
  onToggleGoalMilestone: (goalId: string, milestoneId: string) => void;
  onAddGoal: (title: string, deadline: string, categoryId: string) => void;
}

export const LifeOSModules: React.FC<LifeOSModulesProps> = ({
  selectedDate,
  habits,
  finance,
  goals,
  categories,
  onToggleHabitDate,
  onAddHabit,
  onAddFinance,
  onToggleGoalMilestone,
  onAddGoal,
}) => {
  // Habit form
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCat, setNewHabitCat] = useState(categories[0]?.id || 'cat-health');

  // Finance form
  const [finTitle, setFinTitle] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finType, setFinType] = useState<'income' | 'expense'>('expense');

  // Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('2026-12-31');

  const totalIncome = finance
    .filter((f) => f.type === 'income')
    .reduce((s, f) => s + f.amount, 0);
  const totalExpense = finance
    .filter((f) => f.type === 'expense')
    .reduce((s, f) => s + f.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full overflow-y-auto pb-4">
      {/* 1. Habit & Routine Chain Tracker */}
      <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Alışkanlık & Rutin Zinciri</h3>
              <p className="text-xs text-slate-400">Seçili Gün: {selectedDate}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 flex-1">
          {habits.map((hab) => {
            const isDoneToday = hab.completedDates.includes(selectedDate);
            const cat = categories.find((c) => c.id === hab.categoryId) || categories[0];
            return (
              <div
                key={hab.id}
                onClick={() => onToggleHabitDate(hab.id, selectedDate)}
                className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                  isDoneToday
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                      isDoneToday
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-transparent'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isDoneToday ? 'text-emerald-300 line-through' : 'text-white'
                      }`}
                    >
                      {hab.title}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Hedef: Haftada {hab.targetDaysPerWeek} gün • {cat.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-400">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{hab.completedDates.length}</span>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newHabitTitle.trim()) return;
            onAddHabit(newHabitTitle.trim(), newHabitCat, 7);
            setNewHabitTitle('');
          }}
          className="mt-4 pt-3 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            placeholder="Yeni rutin/alışkanlık ekle..."
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 hover:bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition"
          >
            Ekle
          </button>
        </form>
      </div>

      {/* 2. Strategic Goals & Milestones */}
      <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Uzun Vadeli Hedefler & Projeler</h3>
              <p className="text-xs text-slate-400">Adım adım ilerleme takibi</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          {goals.map((goal) => {
            const doneCount = goal.milestones.filter((m) => m.done).length;
            const pct =
              goal.milestones.length > 0
                ? Math.round((doneCount / goal.milestones.length) * 100)
                : goal.progress;

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{goal.title}</h4>
                  <span className="font-mono text-[11px] font-bold text-indigo-400">%{pct}</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  {goal.milestones.map((ms) => (
                    <label
                      key={ms.id}
                      onClick={() => onToggleGoalMilestone(goal.id, ms.id)}
                      className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={ms.done}
                        onChange={() => {}}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span className={ms.done ? 'line-through text-slate-500' : ''}>
                        {ms.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!goalTitle.trim()) return;
            onAddGoal(goalTitle.trim(), goalDeadline, 'cat-work');
            setGoalTitle('');
          }}
          className="mt-4 pt-3 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            placeholder="Yeni ana hedef ekle..."
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition"
          >
            Ekle
          </button>
        </form>
      </div>

      {/* 3. Personal Finance & Budget Sheet */}
      <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Finans & Bütçe Tablosu</h3>
              <p className="text-xs text-slate-400">Gelir / Gider Özeti</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
            <span className="text-[10px] uppercase text-emerald-400 font-bold block">
              Toplam Gelir
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              +{totalIncome.toLocaleString('tr-TR')} ₺
            </span>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
            <span className="text-[10px] uppercase text-rose-400 font-bold block">
              Toplam Gider
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              -{totalExpense.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto max-h-60">
          {finance.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <span className="text-[10px] text-slate-500 font-mono">{f.date}</span>
              </div>
              <span
                className={`font-mono font-bold ${
                  f.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {f.type === 'income' ? '+' : '-'}
                {f.amount.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const num = Number(finAmount);
            if (!finTitle.trim() || isNaN(num) || num <= 0) return;
            onAddFinance({
              date: selectedDate,
              title: finTitle.trim(),
              amount: num,
              type: finType,
              category: finType === 'income' ? 'Gelir' : 'Gider',
            });
            setFinTitle('');
            setFinAmount('');
          }}
          className="mt-4 pt-3 border-t border-slate-800 space-y-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Açıklama (Örn: Market)..."
              value={finTitle}
              onChange={(e) => setFinTitle(e.target.value)}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="number"
              placeholder="Tutar ₺"
              value={finAmount}
              onChange={(e) => setFinAmount(e.target.value)}
              className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={finType}
              onChange={(e) => setFinType(e.target.value as 'income' | 'expense')}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="expense">Gider (-)</option>
              <option value="income">Gelir (+)</option>
            </select>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white transition"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
