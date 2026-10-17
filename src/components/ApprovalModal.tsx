import React from 'react';
import { ScheduleTask, Category } from '../types';
import { calculateDurationMinutes, formatMinutesHuman } from '../utils/helpers';
import { calculateTaskPointBreakdown } from '../utils/scoring';
import { CheckCircle2, Clock, XCircle, BellRing, Sparkles, Trophy, AlertTriangle } from 'lucide-react';

interface ApprovalModalProps {
  pendingTasks: ScheduleTask[];
  categories: Category[];
  onApprove: (taskId: string, customMinutes?: number) => void;
  onExtend: (taskId: string, extraMinutes: number) => void;
  onPostponeOrCancel: (taskId: string, status: 'postponed' | 'cancelled') => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  pendingTasks,
  categories,
  onApprove,
  onExtend,
  onPostponeOrCancel,
}) => {
  if (pendingTasks.length === 0) return null;

  const currentTask = pendingTasks[0];
  const category = categories.find((c) => c.id === currentTask.categoryId) || categories[0];
  const plannedMinutes = calculateDurationMinutes(currentTask.startTime, currentTask.endTime);
  const pointInfo = calculateTaskPointBreakdown(currentTask, categories);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Top glowing bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: category?.color || '#f59e0b' }}
        />

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 animate-pulse">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Görev Süresi Doldu • Onay & Puan Kararı
                </span>
                <p className="text-xs text-slate-400">
                  Onaylanan görevler pasta grafiğine ve puan cüzdanınıza eklenir
                </p>
              </div>
            </div>
            {pendingTasks.length > 1 && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                +{pendingTasks.length - 1} bekleyen daha
              </span>
            )}
          </div>

          {/* Task details card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${category.color}22`,
                  color: category.color,
                  border: `1px solid ${category.color}44`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name} ({pointInfo.categoryMultiplier}x)
              </span>
              <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded">
                {currentTask.startTime} — {currentTask.endTime} ({formatMinutesHuman(plannedMinutes)})
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{currentTask.title}</h3>
            {currentTask.notes && (
              <p className="text-sm text-slate-400">{currentTask.notes}</p>
            )}

            {/* Point Breakdown Banner */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-1.5">
                <span className="block text-[10px] text-emerald-400 uppercase font-bold">Onay Ödülü</span>
                <span className="font-mono text-sm font-extrabold text-emerald-300">
                  +{pointInfo.rewardPoints} KP
                </span>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-1.5">
                <span className="block text-[10px] text-amber-400 uppercase font-bold">Erteleme</span>
                <span className="font-mono text-sm font-extrabold text-amber-300">
                  {pointInfo.postponePenalty} KP
                </span>
              </div>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-1.5">
                <span className="block text-[10px] text-rose-400 uppercase font-bold">İptal Cezası</span>
                <span className="font-mono text-sm font-extrabold text-rose-300">
                  {pointInfo.cancelPenalty} KP
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onApprove(currentTask.id, plannedMinutes)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 shadow-lg shadow-emerald-600/25 transition"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>
                Tamamlandı Onayla (+{pointInfo.rewardPoints} KP Kazan & Grafiğe Ekle)
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onExtend(currentTask.id, 15)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium py-2.5 px-3 transition"
              >
                <Clock className="h-4 w-4" />
                <span>+15 Dk Uzat (Puan Korunur)</span>
              </button>

              <button
                onClick={() => onExtend(currentTask.id, 30)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium py-2.5 px-3 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>+30 Dk Uzat (Puan Korunur)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => onPostponeOrCancel(currentTask.id, 'postponed')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold py-2 px-3 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Ertele ({pointInfo.postponePenalty} KP)</span>
              </button>
              <button
                onClick={() => onPostponeOrCancel(currentTask.id, 'cancelled')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold py-2 px-3 transition"
              >
                <XCircle className="h-4 w-4" />
                <span>Yapılamadı / İptal ({pointInfo.cancelPenalty} KP)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
