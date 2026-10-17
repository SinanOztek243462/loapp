import { RarityTier, LootPoolItem, DroppedItem, ScheduleTask, Category } from '../types';
import { calculateDurationMinutes } from './helpers';
import { PRIORITY_MULTIPLIERS } from './scoring';

export interface RarityMetadata {
  tier: RarityTier;
  nameTR: string;
  baseProbabilityPct: number; // 50, 30, 13, 6, 1 (Sums to 100%)
  incomeSharePct: number; // 0.5%, 1.5%, 4%, 10%, 30% of Monthly Income
  color: string;
  borderGlow: string;
  bgGradient: string;
  badgeText: string;
}

export const RARITY_TIERS_ORDER: RarityTier[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export const RARITY_CONFIG: Record<RarityTier, RarityMetadata> = {
  common: {
    tier: 'common',
    nameTR: 'Sıradan',
    baseProbabilityPct: 50,
    incomeSharePct: 0.5, // Aylık gelirin %0.5'i
    color: '#94a3b8',
    borderGlow: 'border-slate-500/50',
    bgGradient: 'from-slate-800/80 to-slate-900',
    badgeText: 'SIRADAN (%50)',
  },
  uncommon: {
    tier: 'uncommon',
    nameTR: 'Yaygın',
    baseProbabilityPct: 30,
    incomeSharePct: 1.5, // Aylık gelirin %1.5'i
    color: '#10b981',
    borderGlow: 'border-emerald-500/60',
    bgGradient: 'from-emerald-950/60 to-slate-900',
    badgeText: 'YAYGIN (%30)',
  },
  rare: {
    tier: 'rare',
    nameTR: 'Nadir',
    baseProbabilityPct: 13,
    incomeSharePct: 4.0, // Aylık gelirin %4'ü
    color: '#06b6d4',
    borderGlow: 'border-cyan-500/70',
    bgGradient: 'from-cyan-950/70 to-slate-900',
    badgeText: 'NADİR (%13)',
  },
  epic: {
    tier: 'epic',
    nameTR: 'Epik',
    baseProbabilityPct: 6,
    incomeSharePct: 10.0, // Aylık gelirin %10'u
    color: '#a855f7',
    borderGlow: 'border-purple-500/80',
    bgGradient: 'from-purple-950/75 to-slate-900',
    badgeText: 'EPİK (%6)',
  },
  legendary: {
    tier: 'legendary',
    nameTR: 'Efsanevi',
    baseProbabilityPct: 1,
    incomeSharePct: 30.0, // Aylık gelirin %30'u!
    color: '#f59e0b',
    borderGlow: 'border-amber-400',
    bgGradient: 'from-amber-950/80 via-yellow-950/40 to-slate-900',
    badgeText: '★ EFSANEVİ (%1)',
  },
};

export interface FusionRecipe {
  id: string;
  label: string;
  fromRarity: RarityTier;
  toRarity: RarityTier;
  baseRequiredCount: number; // e.g., 3 for adjacent tier, 10 for Common -> Rare jump
  difficultyFactor: number; // Controls burn probability
  ashConsolationKPPerItem: number; // KP refunded per burned item if fusion fails
}

export const FUSION_RECIPES: FusionRecipe[] = [
  {
    id: 'fuse-c-to-u',
    label: 'Sıradan ➔ Yaygın (Adım Yükseltme)',
    fromRarity: 'common',
    toRarity: 'uncommon',
    baseRequiredCount: 3, // 3 * 0.5% = 1.5%
    difficultyFactor: 0.75, // 75% base success, 25% burn
    ashConsolationKPPerItem: 30,
  },
  {
    id: 'fuse-c-to-r-jump',
    label: '10 Sıradan ➔ 1 Nadir (Doğrudan Sıçrama Kontratı)',
    fromRarity: 'common',
    toRarity: 'rare',
    baseRequiredCount: 10, // 10 * 0.5% = 5.0% -> 4.0% Rare
    difficultyFactor: 0.64, // 10 items = 80% success, 20% burn! (8 items = 64% success)
    ashConsolationKPPerItem: 35,
  },
  {
    id: 'fuse-u-to-r',
    label: 'Yaygın ➔ Nadir (Adım Yükseltme)',
    fromRarity: 'uncommon',
    toRarity: 'rare',
    baseRequiredCount: 3, // 3 * 1.5% = 4.5% -> 4.0% Rare
    difficultyFactor: 0.58, // 3 items = 65% success, 35% burn
    ashConsolationKPPerItem: 75,
  },
  {
    id: 'fuse-r-to-e',
    label: 'Nadir ➔ Epik (Riskli Demirci)',
    fromRarity: 'rare',
    toRarity: 'epic',
    baseRequiredCount: 3, // 3 * 4.0% = 12.0% -> 10.0% Epic
    difficultyFactor: 0.42, // 3 items = 50% success, 50% burn!
    ashConsolationKPPerItem: 160,
  },
  {
    id: 'fuse-e-to-l',
    label: 'Epik ➔ ★ EFSANEVİ (Kader Füzyonu)',
    fromRarity: 'epic',
    toRarity: 'legendary',
    baseRequiredCount: 3, // 3 * 10.0% = 30.0% -> 30.0% Legendary
    difficultyFactor: 0.35, // 3 items = 35% success, 65% burn!
    ashConsolationKPPerItem: 350,
  },
];

/**
 * Mathematical Fusion & Burn Probability Formula:
 * P_success = min(95%, round(((N * alpha_from) / alpha_to) * difficultyFactor * 100) + blessingBonusPct)
 * P_burn = 100% - P_success
 */
export function calculateFusionOdds(params: {
  recipe: FusionRecipe;
  itemCount: number;
  useKPBoost: boolean;
}): {
  inputTotalSharePct: number;
  targetSharePct: number;
  valueRatio: number;
  successPct: number;
  burnPct: number;
  kpBoostCost: number;
  consolationKP: number;
} {
  const { recipe, itemCount, useKPBoost } = params;
  const fromShare = RARITY_CONFIG[recipe.fromRarity].incomeSharePct;
  const toShare = RARITY_CONFIG[recipe.toRarity].incomeSharePct;

  const inputTotalSharePct = Number((itemCount * fromShare).toFixed(2));
  const valueRatio = Number((inputTotalSharePct / toShare).toFixed(2));

  const rawSuccess = Math.round(valueRatio * recipe.difficultyFactor * 100);
  const boostPct = useKPBoost ? 15 : 0;

  // Always keep at least 5% burn risk (max 95% success) for true RPG tension!
  const successPct = Math.max(5, Math.min(95, rawSuccess + boostPct));
  const burnPct = 100 - successPct;

  const kpBoostCost = useKPBoost ? 200 : 0;
  const consolationKP = itemCount * recipe.ashConsolationKPPerItem;

  return {
    inputTotalSharePct,
    targetSharePct: toShare,
    valueRatio,
    successPct,
    burnPct,
    kpBoostCost,
    consolationKP,
  };
}

export const DEFAULT_LOOT_POOL: LootPoolItem[] = [
  // Common (%50 - Gelirin %0.5'i)
  { id: 'lp-c1', title: 'Özel Kahve & Barista İkramı', rarity: 'common' },
  { id: 'lp-c2', title: 'Sinema / Dijital Film Kiralama Keyfi', rarity: 'common' },
  { id: 'lp-c3', title: 'Favori Tatlı / Atıştırmalık Paketi', rarity: 'common' },

  // Uncommon (%30 - Gelirin %1.5'i)
  { id: 'lp-u1', title: 'Yeni Kitap veya Indie Oyun Paketi', rarity: 'uncommon' },
  { id: 'lp-u2', title: 'Dışarıda Güzel Bir Restoran Yemeği', rarity: 'uncommon' },
  { id: 'lp-u3', title: 'Masaüstü Aksesuarı / Küçük Ekipman', rarity: 'uncommon' },

  // Rare (%13 - Gelirin %4'ü)
  { id: 'lp-r1', title: 'AAA Oyun / Yıllık Pro Yazılım Aboneliği', rarity: 'rare' },
  { id: 'lp-r2', title: 'Spor Ayakkabı / Kaliteli Giyim Parçası', rarity: 'rare' },
  { id: 'lp-r3', title: 'Konser / Etkinlik / Spa Günü Bileti', rarity: 'rare' },

  // Epic (%6 - Gelirin %10'u)
  { id: 'lp-e1', title: 'Üst Düzey Kulaklık / Mekanik Klavye / Saat', rarity: 'epic' },
  { id: 'lp-e2', title: 'Hafta Sonu Şehir Dışı Tatil / Kaçamak', rarity: 'epic' },
  { id: 'lp-e3', title: 'Kişisel Hobi / Spor Büyük Ekipmanı', rarity: 'epic' },

  // Legendary (%1 - Gelirin %30'u!)
  { id: 'lp-l1', title: 'EFSANEVİ: Üst Düzey Monitör / Ekran Kartı / Cihaz', rarity: 'legendary' },
  { id: 'lp-l2', title: 'EFSANEVİ: Büyük Tatil / Hayalindeki Mega Hediye', rarity: 'legendary' },
];

/**
 * Mathematical formula for Task Approval Drop Chance:
 * P_drop(t, c, p) = min(0.85, 0.15 + (t / 180) * (c * p) * 0.35)
 */
export function calculateTaskDropTriggerChance(
  task: ScheduleTask,
  categories: Category[]
): number {
  const t =
    task.approvedDurationMinutes ??
    calculateDurationMinutes(task.startTime, task.endTime);
  const cat = categories.find((c) => c.id === task.categoryId);
  const c = cat?.pointMultiplier ?? 1.0;
  const p = PRIORITY_MULTIPLIERS[task.priority] ?? 1.0;

  const prob = 0.15 + (t / 180) * (c * p) * 0.35;
  return Math.min(0.85, Math.max(0.15, Number(prob.toFixed(2))));
}

export function getEffectiveRarityProbabilities(
  luckMultiplier = 1.0,
  pityStreak = 0
): Record<RarityTier, number> {
  const pityBonus = Math.min(4.0, pityStreak * 0.15);
  const legendary = Number(
    (RARITY_CONFIG.legendary.baseProbabilityPct * luckMultiplier + pityBonus).toFixed(2)
  );
  const epic = Number(
    (RARITY_CONFIG.epic.baseProbabilityPct * Math.pow(luckMultiplier, 0.7)).toFixed(2)
  );
  const rare = Number(
    (RARITY_CONFIG.rare.baseProbabilityPct * Math.pow(luckMultiplier, 0.4)).toFixed(2)
  );
  const uncommon = RARITY_CONFIG.uncommon.baseProbabilityPct;

  const used = legendary + epic + rare + uncommon;
  const common = Math.max(5, Number((100 - used).toFixed(2)));

  return {
    common,
    uncommon,
    rare,
    epic,
    legendary,
  };
}

export function calculateExpectedIncomeSharePct(
  probs: Record<RarityTier, number>
): number {
  let ev = 0;
  for (const tier of RARITY_TIERS_ORDER) {
    ev += (probs[tier] / 100) * RARITY_CONFIG[tier].incomeSharePct;
  }
  return Number(ev.toFixed(2));
}

export function createDroppedItemFromTier(params: {
  chosenTier: RarityTier;
  monthlyIncome: number;
  lootPool: LootPoolItem[];
  source: string;
  dateStr: string;
  timeStr: string;
}): DroppedItem {
  const { chosenTier, monthlyIncome, lootPool, source, dateStr, timeStr } = params;
  const meta = RARITY_CONFIG[chosenTier];
  const candidates = lootPool.filter((i) => i.rarity === chosenTier);
  const chosenPoolItem =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : {
          id: 'fallback',
          title: `${meta.nameTR} Bütçe Ödülü`,
          rarity: chosenTier,
        };

  const budgetValueTL = Math.round(
    monthlyIncome * (meta.incomeSharePct / 100)
  );

  return {
    id: `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: chosenPoolItem.title,
    rarity: chosenTier,
    incomeSharePct: meta.incomeSharePct,
    budgetValueTL,
    droppedAtDate: dateStr,
    droppedAtTime: timeStr,
    source,
    claimed: false,
  };
}

export function rollLootDrop(params: {
  monthlyIncome: number;
  lootPool: LootPoolItem[];
  source: string;
  dateStr: string;
  timeStr: string;
  luckMultiplier?: number;
  pityStreak?: number;
}): DroppedItem {
  const {
    monthlyIncome,
    lootPool,
    source,
    dateStr,
    timeStr,
    luckMultiplier = 1.0,
    pityStreak = 0,
  } = params;

  const probs = getEffectiveRarityProbabilities(luckMultiplier, pityStreak);
  const roll = Math.random() * 100;

  let chosenTier: RarityTier = 'common';
  let cumulative = 0;

  const checkOrder: RarityTier[] = [
    'legendary',
    'epic',
    'rare',
    'uncommon',
    'common',
  ];
  for (const tier of checkOrder) {
    cumulative += probs[tier];
    if (roll <= cumulative) {
      chosenTier = tier;
      break;
    }
  }

  return createDroppedItemFromTier({
    chosenTier,
    monthlyIncome,
    lootPool,
    source,
    dateStr,
    timeStr,
  });
}
