import React, { useMemo, useState } from 'react';
import { Category, ScheduleTask } from '../types';
import { calculateDurationMinutes, formatDateISO, formatMinutesHuman } from '../utils/helpers';
import { PieChart as PieIcon, CheckCircle2, Clock, TrendingUp, Filter } from 'lucide-react';

interface CategoryPieChartProps {
  selectedDate: string;
  tasks: ScheduleTask[];
  categories: Category[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  selectedDate,
  tasks,
  categories,
}) => {
  const [rangeMode, setRangeMode] = useState<'week' | 'day' | 'month'>('week');
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  // Compute start & end date of the week containing selectedDate (Monday - Sunday)
  const dateRangeInfo = useMemo(() => {
    const base = new Date(selectedDate + 'T12:00:00');
    if (rangeMode === 'day') {
      return {
        label: `Günlük Dağılım (${selectedDate})`,
        filterFn: (d: string) => d === selectedDate,
      };
    }
    if (rangeMode === 'month') {
      const ym = selectedDate.slice(0, 7);
      return {
        label: `Aylık Dağılım (${ym})`,
        filterFn: (d: string) => d.startsWith(ym),
      };
    }

    // Weekly (Monday to Sunday)
    const dayOfWeek = base.getDay(); // 0 is Sun, 1 is Mon
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = formatDateISO(monday);
    const endStr = formatDateISO(sunday);

    return {
      label: `Haftalık Onaylanan Süre (${startStr.slice(5)} — ${endStr.slice(5)})`,
      filterFn: (d: string) => d >= startStr && d <= endStr,
    };
  }, [selectedDate, rangeMode]);

  const stats = useMemo(() => {
    const filtered = tasks.filter((t) => dateRangeInfo.filterFn(t.date));

    const byCategory = categories.map((cat) => {
      const catTasks = filtered.filter((t) => t.categoryId === cat.id);
      const approvedMinutes = catTasks
        .filter((t) => t.status === 'approved')
        .reduce(
          (sum, t) =>
            sum + (t.approvedDurationMinutes ?? calculateDurationMinutes(t.startTime, t.endTime)),
          0
        );
      const plannedMinutes = catTasks.reduce(
        (sum, t) => sum + calculateDurationMinutes(t.startTime, t.endTime),
        0
      );
      const awaitingCount = catTasks.filter((t) => t.status === 'awaiting_approval').length;

      return {
        category: cat,
        approvedMinutes,
        plannedMinutes,
        awaitingCount,
      };
    });

    const totalApproved = byCategory.reduce((s, item) => s + item.approvedMinutes, 0);
    const totalPlanned = byCategory.reduce((s, item) => s + item.plannedMinutes, 0);

    return {
      byCategory: byCategory.sort((a, b) => b.approvedMinutes - a.approvedMinutes),
      totalApproved,
      totalPlanned,
    };
  }, [tasks, categories, dateRangeInfo]);

  // SVG Donut Pie slices calculation
  const slices = useMemo(() => {
    if (stats.totalApproved === 0) return [];
    let cumulativeFraction = 0;

    return stats.byCategory
      .filter((item) => item.approvedMinutes > 0)
      .map((item) => {
        const fraction = item.approvedMinutes / stats.totalApproved;
        const startAngle = cumulativeFraction * 2 * Math.PI;
        cumulativeFraction += fraction;
        const endAngle = cumulativeFraction * 2 * Math.PI;

        return {
          ...item,
          fraction,
          percentage: Math.round(fraction * 100),
          startAngle,
          endAngle,
        };
      });
  }, [stats]);

  const createArcPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    // Handle 100% single slice case
    if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
      endAngle = startAngle + 2 * Math.PI - 0.001;
    }
    const x1 = 120 + radius * Math.sin(startAngle);
    const y1 = 120 - radius * Math.cos(startAngle);
    const x2 = 120 + radius * Math.sin(endAngle);
    const y2 = 120 - radius * Math.cos(endAngle);

    const x3 = 120 + innerRadius * Math.sin(endAngle);
    const y3 = 120 - innerRadius * Math.cos(endAngle);
    const x4 = 120 + innerRadius * Math.sin(startAngle);
    const y4 = 120 - innerRadius * Math.cos(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
      {/* Header & Range Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <PieIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Kategori Zaman Dağılımı (Pasta Grafiği)</h3>
            <p className="text-xs text-slate-400">{dateRangeInfo.label}</p>
          </div>
        </div>

        <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setRangeMode('day')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              rangeMode === 'day' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Günlük
          </button>
          <button
            onClick={() => setRangeMode('week')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              rangeMode === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Haftalık
          </button>
          <button
            onClick={() => setRangeMode('month')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              rangeMode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aylık
          </button>
        </div>
      </div>

      {/* Main Chart + Legend Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center my-auto">
        {/* Interactive SVG Pie/Donut Chart */}
        <div className="xl:col-span-5 flex flex-col items-center justify-center relative">
          {stats.totalApproved === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 w-56 rounded-full border-2 border-dashed border-slate-800 text-center p-6">
              <Clock className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-400">
                Bu aralıkta henüz onaylanmış görev yok.
              </p>
              <span className="text-[11px] text-slate-500 mt-1">
                Görevleri onayladıkça pasta grafiği otomatik oluşur.
              </span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible">
                {slices.map((slice) => {
                  const isHovered = hoveredCatId === slice.category.id;
                  const outerR = isHovered ? 104 : 96;
                  return (
                    <path
                      key={slice.category.id}
                      d={createArcPath(slice.startAngle, slice.endAngle, outerR, 60)}
                      fill={slice.category.color}
                      stroke="#0f172a"
                      strokeWidth="3"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredCatId(slice.category.id)}
                      onMouseLeave={() => setHoveredCatId(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Summary */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Onaylanan
                </span>
                <span className="text-lg font-extrabold text-white mt-0.5">
                  {formatMinutesHuman(stats.totalApproved)}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  {stats.totalPlanned > 0
                    ? `%${Math.round((stats.totalApproved / stats.totalPlanned) * 100)} Verim`
                    : '100%'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown Table */}
        <div className="xl:col-span-7 space-y-2.5">
          {stats.byCategory.map((item) => {
            const pct =
              stats.totalApproved > 0
                ? Math.round((item.approvedMinutes / stats.totalApproved) * 100)
                : 0;

            return (
              <div
                key={item.category.id}
                onMouseEnter={() => setHoveredCatId(item.category.id)}
                onMouseLeave={() => setHoveredCatId(null)}
                className={`rounded-xl border p-3 transition ${
                  hoveredCatId === item.category.id
                    ? 'border-indigo-500/60 bg-slate-800/90'
                    : 'border-slate-800/80 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.category.color }}
                    />
                    <span className="font-semibold text-slate-200">{item.category.name}</span>
                    {item.awaitingCount > 0 && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        {item.awaitingCount} onay bekliyor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-white">
                      {formatMinutesHuman(item.approvedMinutes)}
                    </span>
                    <span className="text-slate-500">
                      / {formatMinutesHuman(item.plannedMinutes)} plan
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: `${item.category.color}25`,
                        color: item.category.color,
                      }}
                    >
                      %{pct}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Sadece süresi bitip onayladığınız görevler pastaya dahil edilir.
        </span>
        <span className="font-mono text-slate-300">
          Toplam Planlanan: <strong>{formatMinutesHuman(stats.totalPlanned)}</strong>
        </span>
      </div>
    </div>
  );
};
