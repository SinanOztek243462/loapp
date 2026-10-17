import React, { useState, useMemo } from 'react';
import {
  Category,
  ScheduleTask,
  Habit,
  LifeGoal,
  RewardItem,
  RewardRedemption,
  LootPoolItem,
  DroppedItem,
  RarityTier,
} from '../types';
import {
  calculateOverallProfile,
  calculateTaskPointBreakdown,
  calculateDailyDiscipline,
} from '../utils/scoring';
import {
  RARITY_CONFIG,
  RARITY_TIERS_ORDER,
  FUSION_RECIPES,
  FusionRecipe,
  calculateFusionOdds,
  getEffectiveRarityProbabilities,
  calculateExpectedIncomeSharePct,
} from '../utils/loot';
import {
  Trophy,
  Gift,
  Sparkles,
  Plus,
  ShoppingBag,
  History,
  Trash2,
  Award,
  PackageOpen,
  Dices,
  Calculator,
  Check,
  Backpack,
  Flame,
  Anvil,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface PointsAndRewardsViewProps {
  selectedDate: string;
  tasks: ScheduleTask[];
  habits: Habit[];
  goals: LifeGoal[];
  categories: Category[];
  rewards: RewardItem[];
  redemptions: RewardRedemption[];
  monthlyIncome: number;
  onUpdateMonthlyIncome: (newIncome: number) => void;
  lootPool: LootPoolItem[];
  droppedItems: DroppedItem[];
  pityStreak: number;
  onOpenLootChest: (costKP: number, luckMultiplier: number, boxName: string) => void;
  onAttemptFusion: (params: {
    recipe: FusionRecipe;
    itemCount: number;
    useKPBoost: boolean;
  }) => { success: boolean; message: string };
  onAddLootPoolItem: (title: string, rarity: RarityTier) => void;
  onDeleteLootPoolItem: (id: string) => void;
  onToggleClaimDroppedItem: (dropId: string) => void;
  onRedeemReward: (reward: RewardItem) => void;
  onAddReward: (reward: Omit<RewardItem, 'id'>) => void;
  onDeleteReward: (id: string) => void;
  onRefundRedemption: (redemptionId: string) => void;
}

export const PointsAndRewardsView: React.FC<PointsAndRewardsViewProps> = ({
  selectedDate,
  tasks,
  habits,
  goals,
  categories,
  rewards,
  redemptions,
  monthlyIncome,
  onUpdateMonthlyIncome,
  lootPool,
  droppedItems,
  pityStreak,
  onOpenLootChest,
  onAttemptFusion,
  onAddLootPoolItem,
  onDeleteLootPoolItem,
  onToggleClaimDroppedItem,
  onRedeemReward,
  onAddReward,
  onDeleteReward,
  onRefundRedemption,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'loot' | 'forge' | 'store' | 'ledger'
  >('loot');

  // Fusion Forge States
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    FUSION_RECIPES[1].id // Default to "10 Sıradan -> 1 Nadir" as user mentioned!
  );
  const selectedRecipe = useMemo(
    () =>
      FUSION_RECIPES.find((r) => r.id === selectedRecipeId) || FUSION_RECIPES[0],
    [selectedRecipeId]
  );
  const [fusionItemCount, setFusionItemCount] = useState<number>(10);
  const [useKPBoost, setUseKPBoost] = useState<boolean>(false);
  const [lastForgeBanner, setLastForgeBanner] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Sync default item count when switching recipe
  const handleSelectRecipe = (recipe: FusionRecipe) => {
    setSelectedRecipeId(recipe.id);
    setFusionItemCount(recipe.baseRequiredCount);
    setLastForgeBanner(null);
  };

  // Custom Loot Pool Form
  const [poolTitle, setPoolTitle] = useState('');
  const [poolRarity, setPoolRarity] = useState<RarityTier>('legendary');

  // Custom Store Reward Form
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('500');
  const [newCategory, setNewCategory] = useState('Kişisel Ödül');
  const [newDesc, setNewDesc] = useState('');

  const profile = useMemo(
    () => calculateOverallProfile(tasks, habits, goals, categories, redemptions),
    [tasks, habits, goals, categories, redemptions]
  );

  const todayDiscipline = useMemo(
    () => calculateDailyDiscipline(selectedDate, tasks, habits, categories),
    [selectedDate, tasks, habits, categories]
  );

  const effectiveProbs = useMemo(
    () => getEffectiveRarityProbabilities(1.0, pityStreak),
    [pityStreak]
  );

  const expectedIncomeSharePct = useMemo(
    () => calculateExpectedIncomeSharePct(effectiveProbs),
    [effectiveProbs]
  );

  const expectedDropValueTL = Math.round(
    monthlyIncome * (expectedIncomeSharePct / 100)
  );

  // Unclaimed inventory counts by rarity
  const unclaimedByRarity = useMemo(() => {
    const counts: Record<RarityTier, DroppedItem[]> = {
      common: [],
      uncommon: [],
      rare: [],
      epic: [],
      legendary: [],
    };
    droppedItems.forEach((item) => {
      if (!item.claimed) {
        counts[item.rarity].push(item);
      }
    });
    return counts;
  }, [droppedItems]);

  const fusionOdds = useMemo(
    () =>
      calculateFusionOdds({
        recipe: selectedRecipe,
        itemCount: fusionItemCount,
        useKPBoost,
      }),
    [selectedRecipe, fusionItemCount, useKPBoost]
  );

  const availableSourceItems =
    unclaimedByRarity[selectedRecipe.fromRarity].length;
  const canExecuteFusion =
    availableSourceItems >= fusionItemCount &&
    (!useKPBoost || profile.spendableBalance >= 200);

  const ledgerTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          t.status === 'approved' ||
          t.status === 'postponed' ||
          t.status === 'cancelled'
      )
      .sort((a, b) =>
        `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`)
      );
  }, [tasks]);

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = Number(newCost);
    if (!newTitle.trim() || isNaN(costNum) || costNum <= 0) return;

    onAddReward({
      title: newTitle.trim(),
      cost: costNum,
      category: newCategory.trim() || 'Özel',
      description: newDesc.trim() || 'Kişisel disiplin ödülü',
      icon: 'Gift',
    });

    setNewTitle('');
    setNewCost('500');
    setNewDesc('');
  };

  const handleAddPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolTitle.trim()) return;
    onAddLootPoolItem(poolTitle.trim(), poolRarity);
    setPoolTitle('');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-5 pr-1 pb-6">
      {/* Top Banner: Level, Rank, Spendable Balance & Daily Discipline Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Rank & XP Progress (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl font-black text-lg text-white shadow-lg"
                style={{ backgroundColor: profile.rank.badgeColor }}
              >
                Lv.{profile.rank.level}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Disiplin Rütbesi
                </span>
                <h2 className="text-lg font-black text-white">{profile.rank.title}</h2>
                <p className="text-xs text-slate-400">
                  Toplam Deneyim: <strong className="text-white font-mono">{profile.netLifetimePoints} XP</strong>
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block">SONRAKİ SEVİYE</span>
              <span className="text-xs font-bold text-indigo-300">
                {profile.netLifetimePoints} / {profile.rank.nextXP} XP
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${profile.levelProgressPct}%`,
                  backgroundColor: profile.rank.badgeColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Spendable Wallet & Breakdown (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Harcanabilir Sandık & Ödül Cüzdanı
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-white font-mono">
                  {profile.spendableBalance.toLocaleString('tr-TR')}
                </span>
                <span className="text-xs font-bold text-emerald-400">KP</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Trophy className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-center font-mono text-[11px]">
            <div>
              <span className="block text-[9px] text-slate-400 font-sans">Kazanılan</span>
              <span className="font-bold text-emerald-400">
                +{profile.totalEarnedPoints + profile.totalHabitPoints + profile.totalGoalPoints}
              </span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-sans">Cezalar</span>
              <span className="font-bold text-rose-400">{profile.totalPenaltyPoints}</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-sans">Harcanan</span>
              <span className="font-bold text-amber-400">-{profile.totalSpentPoints}</span>
            </div>
          </div>
        </div>

        {/* Today's 0-100 Discipline Grade Card (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Günlük Karne ({selectedDate})
              </span>
              <div className="text-xl font-black text-white mt-0.5">
                {todayDiscipline.score100} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl border"
              style={{
                backgroundColor: `${todayDiscipline.gradeColor}20`,
                color: todayDiscipline.gradeColor,
                borderColor: `${todayDiscipline.gradeColor}50`,
              }}
            >
              {todayDiscipline.letterGrade}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Envanter: <strong className="text-white">{droppedItems.length} İtem</strong>
            </span>
            <span className="font-mono font-bold text-amber-400">
              Pity: +{(pityStreak * 0.15).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('loot')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeSubTab === 'loot'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Dices className="h-4 w-4" />
            <span>İtem Drop & Sandıklar (%1 Efsanevi)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('forge')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeSubTab === 'forge'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-lg shadow-rose-500/20'
                : 'bg-slate-900 text-rose-300 hover:bg-slate-800 border border-rose-500/30'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Demirci & İtem Füzyonu (Yanma Riskli!)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('store')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeSubTab === 'store'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Gift className="h-4 w-4" />
            <span>Sabit KP Ödül Mağazası</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
              activeSubTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Puan Hareket Dökümü</span>
          </button>
        </div>

        {/* Base Monthly Income Setting for Loot Formula */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5">
          <Calculator className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-slate-300 font-medium">Baz Aylık Gelir ($M$):</span>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!isNaN(v) && v >= 0) onUpdateMonthlyIncome(v);
            }}
            className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-emerald-400 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-xs font-bold text-slate-400">₺</span>
        </div>
      </div>

      {/* TAB 1: RPG ITEM DROP & MATHEMATICAL FORMULA SYSTEM */}
      {activeSubTab === 'loot' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Matematiksel Nadirlik & Aylık Gelir Bütçe Dağılımı</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Her görev onayında görev süresine göre otomatik drop şansı tetiklenir veya KP ile sandık açılır. Beklenen Değer:{' '}
                  <strong className="text-emerald-400 font-mono">
                    E[V] = %{expectedIncomeSharePct} Gelir ({expectedDropValueTL.toLocaleString('tr-TR')} ₺ / drop)
                  </strong>
                </p>
              </div>
              <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-mono font-bold text-amber-300">
                Şanssızlık Koruması (Pity): {pityStreak} çekiliş (+%{(pityStreak * 0.15).toFixed(2)} Efsanevi Şansı)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {RARITY_TIERS_ORDER.map((tier) => {
                const meta = RARITY_CONFIG[tier];
                const budgetTL = Math.round(
                  monthlyIncome * (meta.incomeSharePct / 100)
                );
                const effProb = effectiveProbs[tier];
                const poolItems = lootPool.filter((i) => i.rarity === tier);

                return (
                  <div
                    key={tier}
                    className={`rounded-xl border ${meta.borderGlow} bg-gradient-to-b ${meta.bgGradient} p-3.5 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-black uppercase tracking-wider"
                          style={{ color: meta.color }}
                        >
                          {meta.nameTR}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[11px] font-extrabold"
                          style={{
                            backgroundColor: `${meta.color}25`,
                            color: meta.color,
                          }}
                        >
                          %{effProb}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800/80 mb-3">
                        <span className="block text-[10px] text-slate-400">
                          Aylık Gelirin <strong>%{meta.incomeSharePct}</strong>'i
                        </span>
                        <span
                          className="font-mono text-base font-black block mt-0.5"
                          style={{ color: meta.color }}
                        >
                          {budgetTL.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Havuzdaki İtemler ({poolItems.length}):
                        </span>
                        <ul className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {poolItems.map((pi) => (
                            <li
                              key={pi.id}
                              className="flex items-center justify-between text-[11px] text-slate-200 bg-slate-950/50 rounded px-2 py-1"
                            >
                              <span className="truncate">{pi.title}</span>
                              <button
                                onClick={() => onDeleteLootPoolItem(pi.id)}
                                className="text-slate-600 hover:text-rose-400 ml-1"
                                title="Havuzdan Kaldır"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-amber-500/40 bg-slate-900/80 p-5 space-y-3.5">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <PackageOpen className="h-4 w-4 text-amber-400" />
                  <span>KP ile Ganimet Sandığı Aç</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-400">
                        Standart Drop ($\Lambda = 1.0$)
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        Disiplin Sandığı
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Standart olasılıklarla (%1 Efsanevi + Pity) 1 item düşürür.
                      </p>
                    </div>
                    <button
                      disabled={profile.spendableBalance < 250}
                      onClick={() =>
                        onOpenLootChest(250, 1.0, 'Standart Disiplin Sandığı')
                      }
                      className={`mt-3 w-full rounded-lg py-2 px-3 text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                        profile.spendableBalance >= 250
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Dices className="h-4 w-4" />
                      <span>Sandık Aç (250 KP)</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-950 p-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-400">
                        2x Şans Çarpanı ($\Lambda = 2.0$)
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        Efsanevi Avcı Sandığı
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Efsanevi ve Epik düşme olasılığını 2 katına çıkarır!
                      </p>
                    </div>
                    <button
                      disabled={profile.spendableBalance < 600}
                      onClick={() =>
                        onOpenLootChest(600, 2.0, 'Efsanevi Avcı Sandığı (2x Şans)')
                      }
                      className={`mt-3 w-full rounded-lg py-2 px-3 text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                        profile.spendableBalance >= 600
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Şanslı Aç (600 KP)</span>
                    </button>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleAddPool}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
              >
                <span className="text-xs font-extrabold text-white block">
                  + İtem Havuzuna Hayalindeki Eşyayı / Hedefi Ekle
                </span>
                <input
                  type="text"
                  placeholder="İtem / Eşya Adı (Örn: OLED Monitör, PS5, Saat)..."
                  value={poolTitle}
                  onChange={(e) => setPoolTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  required
                />
                <div className="flex gap-2">
                  <select
                    value={poolRarity}
                    onChange={(e) => setPoolRarity(e.target.value as RarityTier)}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white"
                  >
                    {RARITY_TIERS_ORDER.map((t) => {
                      const m = RARITY_CONFIG[t];
                      const tl = Math.round(monthlyIncome * (m.incomeSharePct / 100));
                      return (
                        <option key={t} value={t}>
                          {m.nameTR} (%{m.baseProbabilityPct} Şans • Gelirin %{m.incomeSharePct}'i = {tl.toLocaleString('tr-TR')} ₺)
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white transition"
                  >
                    Havuza Ekle
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Backpack className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Kazanılan İtem Envanteri ({droppedItems.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kullanılmamış itemlerinizi <strong>Demirci & İtem Füzyonu</strong> sekmesinde birleştirip üst kademeye basabilirsiniz!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('forge')}
                  className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-300 transition flex items-center gap-1.5"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>İtemleri Füzele</span>
                </button>
              </div>

              {droppedItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-8 text-center">
                  <PackageOpen className="h-10 w-10 text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-300">
                    Envanterinizde henüz düşen bir item yok.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Soldaki Ganimet Sandığını açarak veya görev onaylayarak ilk iteminizi düşürün!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {droppedItems.map((item) => {
                    const meta = RARITY_CONFIG[item.rarity];
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border ${meta.borderGlow} bg-slate-950/90 p-3.5 flex items-center justify-between gap-3 transition`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs border"
                            style={{
                              backgroundColor: `${meta.color}20`,
                              borderColor: meta.color,
                              color: meta.color,
                            }}
                          >
                            %{item.incomeSharePct}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-black uppercase"
                                style={{
                                  backgroundColor: `${meta.color}25`,
                                  color: meta.color,
                                }}
                              >
                                {meta.nameTR}
                              </span>
                              <h4
                                className={`text-xs font-extrabold truncate ${
                                  item.claimed
                                    ? 'line-through text-slate-500'
                                    : 'text-white'
                                }`}
                              >
                                {item.title}
                              </h4>
                            </div>
                            <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                              {item.droppedAtDate} {item.droppedAtTime} • {item.source}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <span
                              className="text-sm font-black block"
                              style={{ color: meta.color }}
                            >
                              {item.budgetValueTL.toLocaleString('tr-TR')} ₺
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Gelirin %{item.incomeSharePct}'i
                            </span>
                          </div>

                          <button
                            onClick={() => onToggleClaimDroppedItem(item.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                              item.claimed
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{item.claimed ? 'Kullanıldı' : 'Ödülü Kullan'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEMİRCİ & İTEM FÜZYON ATÖLYESİ (WITH BURN RISK!) */}
      {activeSubTab === 'forge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Cols: Recipe Selection & Inventory Stock by Rarity */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-3">
                1. Envanterdeki Kullanılabilir İtem Stoğunuz
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {RARITY_TIERS_ORDER.map((tier) => {
                  const meta = RARITY_CONFIG[tier];
                  const count = unclaimedByRarity[tier].length;
                  return (
                    <div
                      key={tier}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-2.5"
                    >
                      <span
                        className="block text-[10px] font-black uppercase"
                        style={{ color: meta.color }}
                      >
                        {meta.nameTR}
                      </span>
                      <span className="font-mono text-lg font-black text-white mt-0.5 block">
                        {count}
                      </span>
                      <span className="text-[9px] text-slate-500">adet</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2">
                2. Füzyon Kontratı / Tarif Seçin
              </h3>
              {FUSION_RECIPES.map((recipe) => {
                const fromMeta = RARITY_CONFIG[recipe.fromRarity];
                const toMeta = RARITY_CONFIG[recipe.toRarity];
                const isSelected = recipe.id === selectedRecipe.id;
                const stock = unclaimedByRarity[recipe.fromRarity].length;

                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className={`w-full rounded-xl border p-3.5 text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-black">
                        <span style={{ color: fromMeta.color }}>
                          {recipe.baseRequiredCount}x {fromMeta.nameTR}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                        <span style={{ color: toMeta.color }}>
                          1x {toMeta.nameTR} (%{toMeta.incomeSharePct} Gelir)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {recipe.label}
                      </p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${
                        stock >= recipe.baseRequiredCount
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Stok: {stock}/{recipe.baseRequiredCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 7 Cols: Interactive Blacksmith Forge & Mathematical Burn Calculator */}
          <div className="lg:col-span-7 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-slate-900 via-rose-950/15 to-slate-950 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    <Flame className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                      Demirci Füzyon Ocağı • Matematiksel Yanma Sistemi
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {selectedRecipe.label}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Result Feedback Banner if user just forged */}
              {lastForgeBanner && (
                <div
                  className={`mb-5 rounded-xl border p-4 flex items-center gap-3 animate-fadeIn ${
                    lastForgeBanner.success
                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                      : 'border-rose-500/60 bg-rose-950/50 text-rose-200'
                  }`}
                >
                  {lastForgeBanner.success ? (
                    <Sparkles className="h-6 w-6 text-emerald-400 shrink-0" />
                  ) : (
                    <Flame className="h-6 w-6 text-rose-400 shrink-0 animate-bounce" />
                  )}
                  <div className="text-xs font-bold leading-relaxed">
                    {lastForgeBanner.message}
                  </div>
                </div>
              )}

              {/* Quantity Adjuster (Put more items to increase success odds!) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Ocağa Konulacak{' '}
                      <strong
                        style={{
                          color: RARITY_CONFIG[selectedRecipe.fromRarity].color,
                        }}
                      >
                        {RARITY_CONFIG[selectedRecipe.fromRarity].nameTR}
                      </strong>{' '}
                      İtem Sayısı ($N$)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Daha fazla item koyarak başarı şansını artırabilir, daha az koyarak yüksek yanma riskiyle şansınızı deneyebilirsiniz!
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFusionItemCount((c) => Math.max(2, c - 1))
                      }
                      className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 font-mono text-sm font-bold text-white"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-mono text-base font-black text-amber-400">
                      {fusionItemCount}x
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFusionItemCount((c) => Math.min(15, c + 1))
                      }
                      className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 font-mono text-sm font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* KP Blessing Toggle */}
                <label className="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={useKPBoost}
                      onChange={(e) => setUseKPBoost(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-indigo-300 block">
                        ✨ Demirci Kutsama Parşömeni Ekle (+200 KP)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Başarı ihtimalini doğrudan <strong>+%15 artırır</strong>, yanma riskini düşürür.
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-indigo-400">
                    +%15 Şans
                  </span>
                </label>
              </div>

              {/* Mathematical Probability & Value Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">
                    Girdi Değeri
                  </span>
                  <span className="font-mono text-sm font-black text-slate-200 mt-1 block">
                    %{fusionOdds.inputTotalSharePct} Gelir
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">
                    Hedef Ödül Değeri
                  </span>
                  <span
                    className="font-mono text-sm font-black mt-1 block"
                    style={{
                      color: RARITY_CONFIG[selectedRecipe.toRarity].color,
                    }}
                  >
                    %{fusionOdds.targetSharePct} Gelir
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-center">
                  <span className="block text-[10px] text-emerald-400 uppercase font-bold">
                    Başarı Şansı
                  </span>
                  <span className="font-mono text-lg font-black text-emerald-300 mt-0.5 block">
                    %{fusionOdds.successPct}
                  </span>
                </div>

                <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-3 text-center">
                  <span className="block text-[10px] text-rose-400 uppercase font-bold">
                    🔥 Yanma İhtimali
                  </span>
                  <span className="font-mono text-lg font-black text-rose-400 mt-0.5 block">
                    %{fusionOdds.burnPct}
                  </span>
                </div>
              </div>

              {/* Visual Success vs Burn Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-emerald-400">
                    ✓ Başarılı Füzyon: %{fusionOdds.successPct}
                  </span>
                  <span className="text-rose-400">
                    🔥 Yanma (Kül Olma): %{fusionOdds.burnPct}
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-rose-950 border border-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                    style={{ width: `${fusionOdds.successPct}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-orange-600 transition-all duration-300"
                    style={{ width: `${fusionOdds.burnPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>
                    💡 <strong>Yanarsa Teselli Koruması:</strong> Ocağa koyduğunuz{' '}
                    {fusionItemCount} item yanarsa{' '}
                    <strong className="text-amber-300">
                      +{fusionOdds.consolationKP} KP Kül İadesi
                    </strong>{' '}
                    ve <strong className="text-amber-300">+2 Pity Şansı</strong> kazanırsınız.
                  </span>
                </p>
              </div>
            </div>

            <button
              disabled={!canExecuteFusion}
              onClick={() => {
                const res = onAttemptFusion({
                  recipe: selectedRecipe,
                  itemCount: fusionItemCount,
                  useKPBoost,
                });
                setLastForgeBanner(res);
              }}
              className={`w-full rounded-xl py-3.5 px-5 text-sm font-black transition flex items-center justify-center gap-2 shadow-xl ${
                canExecuteFusion
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Flame className="h-5 w-5" />
              <span>
                {availableSourceItems < fusionItemCount
                  ? `Yetersiz İtem Stoğu (${availableSourceItems}/${fusionItemCount} ${
                      RARITY_CONFIG[selectedRecipe.fromRarity].nameTR
                    })`
                  : `${fusionItemCount}x ${
                      RARITY_CONFIG[selectedRecipe.fromRarity].nameTR
                    } İtemi Ocağa At ve Füzele! (%${fusionOdds.successPct} Şans)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: FIXED KP REWARD STORE */}
      {activeSubTab === 'store' && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
            {rewards.map((reward) => {
              const canAfford = profile.spendableBalance >= reward.cost;
              const timesBought = redemptions.filter(
                (r) => r.rewardId === reward.id
              ).length;

              return (
                <div
                  key={reward.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                    canAfford
                      ? 'border-slate-800 bg-slate-950/80 hover:border-amber-500/50'
                      : 'border-slate-800/50 bg-slate-950/40 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {reward.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {timesBought > 0 && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {timesBought}x kullanıldı
                          </span>
                        )}
                        <button
                          onClick={() => onDeleteReward(reward.id)}
                          className="text-slate-600 hover:text-rose-400 transition"
                          title="Ödülü Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white">{reward.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{reward.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-amber-400">
                      {reward.cost.toLocaleString('tr-TR')} KP
                    </span>

                    <button
                      disabled={!canAfford}
                      onClick={() => onRedeemReward(reward)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{canAfford ? 'Ödülü Al' : 'Yetersiz KP'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleCreateReward}
            className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2.5"
          >
            <span className="text-xs font-bold text-amber-400 block">
              + Mağazaya Yeni Sabit Puanlı Ödül Ekle
            </span>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Ödül Başlığı..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="md:col-span-5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                required
              />
              <input
                type="text"
                placeholder="Açıklama..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="md:col-span-3 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                placeholder="Bedel (KP)"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-amber-300 font-mono"
                required
              />
              <button
                type="submit"
                className="md:col-span-2 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Ödül Ekle</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: POINT LEDGER & RULES */}
      {activeSubTab === 'ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              <span>Hibrit Puan, Drop & Füzyon Formülleri</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center justify-between">
                <span>⏱️ Görev Onayı Puanı:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Dakika × Kategori × Öncelik
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>🎲 Görevden Drop Düşme Şansı:</span>
                <span className="font-mono text-amber-400 font-bold">
                  %15 + (Süre/180) × Çarpan × %35
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>🔥 Demirci Füzyon Başarı Formülü:</span>
                <span className="font-mono text-rose-400 font-bold">
                  (N × α_girdi / α_hedef) × Zorluk
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>⏳ Görev Erteleme Kesintisi:</span>
                <span className="font-mono text-amber-400 font-bold">-%15 KP</span>
              </li>
              <li className="flex items-center justify-between">
                <span>❌ Görev İptali Cezası:</span>
                <span className="font-mono text-rose-400 font-bold">-%45 KP</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-3">
              Puan Hareket Dökümü
            </h3>
            <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
              {ledgerTasks.map((t) => {
                const bd = calculateTaskPointBreakdown(t, categories);
                const isPos = bd.currentNetPoints > 0;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{t.title}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t.date} ({t.startTime}-{t.endTime})
                      </span>
                    </div>
                    <span
                      className={`font-mono font-extrabold ${
                        isPos
                          ? 'text-emerald-400'
                          : t.status === 'postponed'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {isPos ? `+${bd.currentNetPoints}` : bd.currentNetPoints} KP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
