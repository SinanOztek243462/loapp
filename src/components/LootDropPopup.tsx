import React from 'react';
import { DroppedItem } from '../types';
import { RARITY_CONFIG } from '../utils/loot';
import { Sparkles, PackageOpen, Check, Trophy } from 'lucide-react';

interface LootDropPopupProps {
  droppedItem: DroppedItem | null;
  monthlyIncome: number;
  onClose: () => void;
}

export const LootDropPopup: React.FC<LootDropPopupProps> = ({
  droppedItem,
  monthlyIncome,
  onClose,
}) => {
  if (!droppedItem) return null;

  const meta = RARITY_CONFIG[droppedItem.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className={`relative w-full max-w-md rounded-2xl border-2 ${meta.borderGlow} bg-gradient-to-b ${meta.bgGradient} p-6 text-center shadow-2xl overflow-hidden`}
        style={{
          boxShadow: `0 0 50px -10px ${meta.color}55`,
        }}
      >
        {/* Top Rarity Pill */}
        <div className="flex justify-center mb-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-widest border"
            style={{
              backgroundColor: `${meta.color}25`,
              color: meta.color,
              borderColor: `${meta.color}80`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {meta.badgeText} İTEM DÜŞTÜ!
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4">{droppedItem.source}</p>

        {/* Center Glowing Icon Box */}
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 shadow-inner"
          style={{
            backgroundColor: `${meta.color}20`,
            borderColor: meta.color,
            color: meta.color,
          }}
        >
          {droppedItem.rarity === 'legendary' || droppedItem.rarity === 'epic' ? (
            <Trophy className="h-10 w-10 animate-bounce" />
          ) : (
            <PackageOpen className="h-10 w-10" />
          )}
        </div>

        {/* Item Title */}
        <h2 className="text-xl font-black text-white mb-2">{droppedItem.title}</h2>

        {/* Mathematical Income Share Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 my-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Baz Aylık Gelir ($M$):</span>
            <span className="font-mono text-slate-200">
              {monthlyIncome.toLocaleString('tr-TR')} ₺
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nadirlik Gelir Katsayısı ($\alpha$):</span>
            <span className="font-mono font-bold" style={{ color: meta.color }}>
              %{droppedItem.incomeSharePct} ({meta.nameTR})
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Kazanılan Ödül Bütçesi:
            </span>
            <span
              className="font-mono text-lg font-black"
              style={{ color: meta.color }}
            >
              {droppedItem.budgetValueTL.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-black text-slate-950 transition shadow-lg"
          style={{ backgroundColor: meta.color }}
        >
          <Check className="h-5 w-5 stroke-[3]" />
          <span>Envantere (Çantaya) Ekle</span>
        </button>
      </div>
    </div>
  );
};
