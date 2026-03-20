import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
      if (task.status === 'todo' || task.status === 'doing') return new Date();
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

          <div className="flex items-center gap-0 border-b border-white/[0.06]">
            {(['planned', 'completed', 'created'] as AnalyticsMode[]).map((entryMode) => (
              <button
                key={entryMode}
                onClick={() => setMode(entryMode)}
                className={`px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-colors relative ${mode === entryMode ? 'text-white' : 'text-white/30 hover:text-white/60'
                  }`}
              >
                {MODE_LABELS[entryMode]}
                {mode === entryMode && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-flow-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col space-y-6 flex-1"
          >
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
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 border-b border-white/[0.05] pb-4">
                  Insight del día
                </p>

                {/* Ring + número */}
                <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                  <InsightRing count={todayCount} goal={3} />
                  <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-4">
                    {MODE_LABELS[mode].toLowerCase()} hoy
                  </p>
                  {/* Dots de progreso hacia el goal */}
                  <div className="flex items-center gap-2 mt-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="rounded-full"
                        animate={{
                          backgroundColor: i < todayCount ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                          scale: i < todayCount ? 1 : 0.85,
                        }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        style={{ width: 6, height: 6 }}
                      />
                    ))}
                    <span className="text-[10px] font-mono text-white/20 ml-1">/ 3</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.05]">
                  <p className="text-sm text-white/50 leading-relaxed">
                    {todayCount >= 3 ? (
                      <>Vas muy bien. Mantén ese ritmo para{' '}
                        <span className="text-white/80">cerrar fuerte</span> el día.
                      </>
                    ) : (
                      <>Objetivo: llegar a <span className="text-white/80">3</span> para sostener
                        {' '}consistencia operativa.
                      </>
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
              <HitoCard totalCompleted={totalCompleted} progressPct={progressPct} pendingTasks={pendingTasks} />

            </div>
          </motion.div>
        </AnimatePresence>
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
  key?: string;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="glass rounded-2xl p-5 flex flex-col justify-between border relative overflow-hidden cursor-default select-none"
      style={{
        transition: 'border-color 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        borderColor: hovered ? `${accent}40` : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient glow desde esquina inferior derecha */}
      <motion.div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ backgroundColor: accent }}
        animate={{ opacity: hovered ? 0.07 : 0, scale: hovered ? 1.2 : 0.8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Línea superior de acento */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ backgroundColor: accent }}
        animate={{ opacity: hovered ? 0.4 : 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Watermark con paralaje */}
      <motion.span
        className="absolute -right-2 -bottom-3 text-6xl font-display font-bold leading-none pointer-events-none select-none"
        style={{ color: accent }}
        animate={{ opacity: hovered ? 0.1 : 0.04, x: hovered ? -4 : 0, y: hovered ? -4 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {value}
      </motion.span>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <motion.div
          className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center ${color}`}
          animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 6 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          {icon}
        </motion.div>
        <motion.span
          className="text-[10px] uppercase tracking-widest font-mono text-right leading-tight max-w-[110px]"
          animate={{ color: hovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)' }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      </div>

      {/* Valor principal */}
      <div className="relative z-10">
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`text-4xl font-display font-bold ${color} leading-none origin-left`}
        >
          {value}
        </motion.p>
        <motion.p
          className="text-[10px] font-mono mt-1.5"
          animate={{ color: hovered ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)' }}
          transition={{ duration: 0.2 }}
        >
          {sublabel}
        </motion.p>
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

// Ring de progreso para el Insight del día
function InsightRing({ count, goal }: { count: number; goal: number }) {
  const size = 120;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(count / goal, 1);
  const offset = circumference - progress * circumference;
  const isComplete = count >= goal;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? '#10b981' : '#3b82f6'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            filter: isComplete
              ? 'drop-shadow(0 0 6px rgba(16,185,129,0.6))'
              : 'drop-shadow(0 0 6px rgba(59,130,246,0.5))',
          }}
        />
      </svg>
      {/* Número central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={count}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold leading-none"
          style={{
            fontSize: 44,
            color: isComplete ? '#10b981' : '#3b82f6',
          }}
        >
          {count}
        </motion.span>
      </div>
    </div>
  );
}

// Card Próximo Gran Hito con hover en barra
function HitoCard({
  totalCompleted,
  progressPct,
  pendingTasks,
}: {
  totalCompleted: number;
  progressPct: number;
  pendingTasks: number;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="md:col-span-2 lg:col-span-4 glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between border relative overflow-hidden min-h-[200px] cursor-default select-none"
      style={{
        transition: 'border-color 0.35s ease',
        borderColor: hovered ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Watermark 50 */}
      <motion.span
        className="absolute -right-4 -bottom-6 text-[120px] font-display font-bold leading-none pointer-events-none select-none"
        animate={{ opacity: hovered ? 0.07 : 0.04, x: hovered ? -6 : 0, y: hovered ? -6 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ color: '#10b981' }}
      >
        50
      </motion.span>

      {/* Glow desde esquina */}
      <motion.div
        className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ backgroundColor: '#10b981' }}
        animate={{ opacity: hovered ? 0.06 : 0, scale: hovered ? 1.2 : 0.8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Línea top acento */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ backgroundColor: '#10b981' }}
        animate={{ opacity: hovered ? 0.35 : 0 }}
        transition={{ duration: 0.25 }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/50">
          Próximo Gran Hito
        </h4>
        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/40">
          <ArrowUpRight className="w-3 h-3" />
          meta
        </span>
      </div>

      <div className="flex items-end justify-between mb-5 relative z-10">
        <div>
          <motion.p
            key={totalCompleted}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, scale: hovered ? 1.03 : 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-display font-bold text-white/90 leading-none origin-left"
          >
            {totalCompleted}
          </motion.p>
          <p className="text-[10px] font-mono text-white/25 mt-1 uppercase tracking-widest">
            de 50 tareas
          </p>
        </div>
        <motion.p
          className="text-2xl font-display font-bold"
          animate={{ color: hovered ? 'rgba(16,185,129,0.9)' : 'rgba(16,185,129,0.5)' }}
          transition={{ duration: 0.25 }}
        >
          {progressPct.toFixed(0)}%
        </motion.p>
      </div>

      {/* Barra de progreso reactiva */}
      <div className="space-y-2 relative z-10">
        <div className="w-full bg-white/[0.05] rounded-full overflow-hidden"
          style={{ height: hovered ? 6 : 4, transition: 'height 0.3s ease' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-emerald-500 rounded-full"
            style={{
              boxShadow: hovered
                ? '0 0 16px rgba(16,185,129,0.7)'
                : '0 0 8px rgba(16,185,129,0.35)',
              transition: 'box-shadow 0.3s ease',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: hovered ? 1 : 0.6 }}
            />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              {pendingTasks} pendientes
            </span>
          </div>
          <motion.span
            className="text-[10px] font-mono"
            animate={{ color: hovered ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)' }}
            transition={{ duration: 0.2 }}
          >
            {50 - totalCompleted} restantes
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}