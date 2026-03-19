import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Target, Flame, Calendar, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Task } from '../types';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface AnalyticsViewProps {
  tasks: Task[];
  onPlanNextWeek?: () => void;
  isPlanningNextWeek?: boolean;
}

interface ChartPoint {
  name: string;
  count: number;
  date: Date;
}

type AnalyticsMode = 'completed' | 'planned' | 'created';

const MODE_LABELS: Record<AnalyticsMode, string> = {
  completed: 'Completadas',
  planned: 'Programadas',
  created: 'Creadas',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  onPlanNextWeek,
  isPlanningNextWeek = false,
}) => {
  const [mode, setMode] = useState<AnalyticsMode>('planned');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const modeTasks = useMemo(() => {
    if (mode === 'completed') return tasks.filter((t) => t.status === 'done');
    if (mode === 'planned')
      return tasks.filter((t) => !!t.due_date || t.status === 'todo' || t.status === 'doing');
    return tasks;
  }, [tasks, mode]);

  const dateForMode = (task: Task, selectedMode: AnalyticsMode): Date | null => {
    if (selectedMode === 'completed') {
      if (task.completed_at) return new Date(task.completed_at);
      if (task.status === 'done') return new Date(task.created_at);
      return null;
    }
    if (selectedMode === 'planned') {
      if (task.due_date) return new Date(task.due_date);
      if (task.status === 'todo' || task.status === 'doing') return new Date(task.created_at);
      return null;
    }
    return task.created_at ? new Date(task.created_at) : null;
  };

  const last7Days: ChartPoint[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      const dayTasks = modeTasks.filter((t) => {
        const sourceDate = dateForMode(t, mode);
        if (!sourceDate || Number.isNaN(sourceDate.getTime())) return false;
        return isSameDay(sourceDate, date);
      });
      return { name: format(date, 'EEE', { locale: es }), count: dayTasks.length, date };
    }).reverse();
  }, [modeTasks, mode]);

  const totalCompleted = tasks.filter((t) => t.status === 'done').length;
  const weekPlanned = last7Days.reduce((acc, d) => acc + d.count, 0);
  const avgPerDay = parseFloat((weekPlanned / 7).toFixed(1));
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
  const streak = calculateStreak(last7Days);
  const todayCount = last7Days[last7Days.length - 1]?.count ?? 0;

  const weeklyCompleted = tasks.filter((task) => {
    if (task.status !== 'done') return false;
    const d = task.completed_at ? new Date(task.completed_at) : new Date(task.created_at);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }).length;

  const weeklyCreated = tasks.filter((task) => {
    return isWithinInterval(new Date(task.created_at), { start: weekStart, end: weekEnd });
  }).length;

  const carryOver = tasks.filter((task) => {
    if (task.status === 'done') return false;
    return new Date(task.created_at) < weekStart;
  }).length;

  const suggestedForNextWeek = tasks.filter((task) => task.status === 'backlog').length;
  const progressPct = Math.min((totalCompleted / 50) * 100, 100);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-1">
            {format(payload[0].payload.date, 'EEEE d MMM', { locale: es })}
          </p>
          <p className="text-lg font-display font-bold text-flow-accent">
            {payload[0].value}
            <span className="text-xs text-white/40 font-mono ml-2 font-normal">
              {MODE_LABELS[mode].toLowerCase()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-full py-6 px-4 md:px-12 md:pl-24 pt-20 pb-32 md:pb-6 flex flex-col overflow-y-auto no-scrollbar"
    >
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col space-y-6 pb-6">

        {/* Header */}
        <header className="space-y-4 shrink-0">
          <div className="flex items-center gap-2 text-flow-accent font-mono text-xs tracking-widest uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Rendimiento</span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Tu Flujo de Trabajo</h1>

          {/* Tab-style mode selector */}
          <div className="flex items-center gap-0 border-b border-white/[0.06]">
            {(['planned', 'completed', 'created'] as AnalyticsMode[]).map((entryMode) => (
              <button
                key={entryMode}
                onClick={() => setMode(entryMode)}
                className={`px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-all relative ${mode === entryMode
                    ? 'text-white'
                    : 'text-white/30 hover:text-white/60'
                  }`}
              >
                {MODE_LABELS[entryMode]}
                {mode === entryMode && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-flow-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
          {[
            {
              icon: <Target className="w-4 h-4" />,
              label: 'Completadas',
              value: totalCompleted,
              sublabel: 'total',
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500/10',
              accent: '#10b981',
              delay: 0,
            },
            {
              icon: <BarChart3 className="w-4 h-4" />,
              label: `${MODE_LABELS[mode]} semana`,
              value: weekPlanned,
              sublabel: 'últimos 7 días',
              color: 'text-flow-accent',
              bgColor: 'bg-flow-accent/10',
              accent: '#3b82f6',
              delay: 0.05,
            },
            {
              icon: <TrendingUp className="w-4 h-4" />,
              label: 'Promedio diario',
              value: avgPerDay,
              sublabel: MODE_LABELS[mode].toLowerCase() + '/día',
              color: 'text-amber-400',
              bgColor: 'bg-amber-500/10',
              accent: '#f59e0b',
              delay: 0.1,
            },
            {
              icon: <Flame className="w-4 h-4" />,
              label: 'Racha',
              value: streak,
              sublabel: streak === 1 ? 'día' : 'días',
              color: 'text-orange-400',
              bgColor: 'bg-orange-500/10',
              accent: '#f97316',
              delay: 0.15,
            },
          ].map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>

        {/* Main grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5 pb-6">

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 lg:col-span-8 glass rounded-3xl p-6 flex flex-col space-y-4 min-h-[300px] lg:min-h-[350px] group border border-white/[0.04] hover:border-white/[0.08] transition-colors relative overflow-hidden"
          >
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-base font-display font-semibold text-white/90">Actividad Semanal</h3>
              <div className="flex items-center gap-2 text-[10px] text-flow-accent/60 bg-flow-accent/10 px-3 py-1.5 rounded-full font-mono uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                <span>{MODE_LABELS[mode]} por día</span>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days} barCategoryGap="28%">
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'rgba(255,255,255,0.22)',
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                    }}
                    dy={12}
                  />
                  <YAxis hide />
                  {avgPerDay > 0 && (
                    <ReferenceLine
                      y={avgPerDay}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="4 4"
                      label={{
                        value: `avg ${avgPerDay}`,
                        position: 'insideTopRight',
                        fill: 'rgba(255,255,255,0.2)',
                        fontSize: 9,
                        fontFamily: 'monospace',
                      }}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 3, 3]} barSize={36}>
                    {last7Days.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          isSameDay(entry.date, new Date())
                            ? 'var(--color-flow-accent)'
                            : entry.count > 0
                              ? 'rgba(59,130,246,0.45)'
                              : 'rgba(255,255,255,0.03)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 shrink-0 pt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-flow-accent" />
                <span className="text-[10px] font-mono text-white/30">hoy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-flow-accent/45" />
                <span className="text-[10px] font-mono text-white/30">días anteriores</span>
              </div>
              {avgPerDay > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-px border-t border-dashed border-white/20" />
                  <span className="text-[10px] font-mono text-white/30">promedio</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Insight */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="md:col-span-2 lg:col-span-4 glass rounded-3xl p-7 flex flex-col border border-white/[0.04] hover:border-white/[0.08] relative overflow-hidden group min-h-[250px] lg:min-h-[350px]"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-auto border-b border-white/[0.05] pb-4">
              Insight del día
            </p>

            {/* Big number hero */}
            <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
              <motion.p
                key={todayCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[80px] font-display font-bold leading-none text-flow-accent"
              >
                {todayCount}
              </motion.p>
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-2">
                {MODE_LABELS[mode].toLowerCase()} hoy
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-white/[0.05]">
              <p className="text-sm text-white/50 leading-relaxed">
                {todayCount >= 3 ? (
                  <>Vas muy bien. Mantén ese ritmo para <span className="text-white/80">cerrar fuerte</span> el día.</>
                ) : (
                  <>Objetivo recomendado: llegar a <span className="text-white/80">3</span> para sostener consistencia operativa.</>
                )}
              </p>
            </div>
          </motion.div>

          {/* Revisión Automática */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 lg:col-span-8 glass rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between border border-white/[0.04] hover:border-white/[0.08] transition-colors relative overflow-hidden group"
          >
            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                  Revisión Automática
                </h4>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-flow-accent/70 mb-3 pl-3.5">
                {format(weekStart, 'd MMM', { locale: es })} — {format(weekEnd, 'd MMM', { locale: es })}
              </p>
              <p className="text-sm text-white/35 leading-relaxed max-w-sm">
                El planificador traslada prioritarias del backlog a 'Hoy' preparando tu próxima semana sin esfuerzo.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
              {[
                { label: 'Dones', value: weeklyCompleted, color: 'text-emerald-400', delay: 0.32 },
                { label: 'News', value: weeklyCreated, color: 'text-blue-400', delay: 0.34 },
                { label: 'Delay', value: carryOver, color: 'text-amber-400', delay: 0.36 },
                { label: 'Backlog', value: Math.min(suggestedForNextWeek, 3), color: 'text-flow-accent', delay: 0.38 },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay }}
                >
                  <StatBox label={stat.label} value={stat.value} color={stat.color} />
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 w-full lg:w-auto shrink-0">
              <button
                disabled={!onPlanNextWeek || isPlanningNextWeek || suggestedForNextWeek === 0}
                onClick={() => onPlanNextWeek?.()}
                className="w-full lg:w-auto px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-flow-accent
                           text-white/50 hover:text-white border border-white/[0.06] hover:border-transparent
                           disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white/50
                           transition-all flex items-center justify-center gap-2.5 group/btn"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">
                  {isPlanningNextWeek ? 'Planificando...' : 'Autoplanificar'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
              </button>
            </div>
          </motion.div>

          {/* Próximo Gran Hito */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="md:col-span-2 lg:col-span-4 glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/[0.04] hover:border-emerald-500/15 transition-colors relative overflow-hidden group min-h-[200px]"
          >
            {/* Background number watermark */}
            <span className="absolute -right-4 -bottom-6 text-[120px] font-display font-bold text-emerald-500/[0.04] leading-none pointer-events-none select-none">
              50
            </span>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/50">
                Próximo Gran Hito
              </h4>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/40">
                <ArrowUpRight className="w-3 h-3" />
                meta
              </span>
            </div>

            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-4xl font-display font-bold text-white/90 leading-none">
                  {totalCompleted}
                </p>
                <p className="text-[10px] font-mono text-white/25 mt-1 uppercase tracking-widest">
                  de 50 tareas
                </p>
              </div>
              <p className="text-2xl font-display font-bold text-emerald-400/60">
                {progressPct.toFixed(0)}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    {pendingTasks} pendientes
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/20">
                  {50 - totalCompleted} restantes
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

function MetricCard({
  icon,
  label,
  value,
  sublabel,
  color,
  bgColor,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sublabel: string;
  color: string;
  bgColor: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-5 flex flex-col justify-between group border border-white/[0.04] hover:border-white/[0.09] transition-all duration-300 relative overflow-hidden"
    >
      {/* Watermark number */}
      <span
        className="absolute -right-2 -bottom-3 text-6xl font-display font-bold leading-none pointer-events-none select-none opacity-[0.04]"
        style={{ color: accent }}
      >
        {value}
      </span>

      <div className="flex items-center justify-between mb-4">
        <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/25 font-mono text-right leading-tight max-w-[100px]">
          {label}
        </span>
      </div>

      <div>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-4xl font-display font-bold ${color} leading-none`}
        >
          {value}
        </motion.p>
        <p className="text-[10px] text-white/20 mt-1.5 font-mono">{sublabel}</p>
      </div>
    </motion.div>
  );
}

function calculateStreak(days: ChartPoint[]): number {
  let acc = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) acc++;
    else break;
  }
  return acc;
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/[0.04] px-4 py-3 flex flex-col justify-center min-w-[72px] border border-white/[0.05] hover:border-white/10 transition-colors">
      <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1 font-mono">{label}</p>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}