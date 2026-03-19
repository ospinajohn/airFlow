import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Target, Flame, Calendar, CheckCircle2 } from 'lucide-react';
import { Task } from '../types';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

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

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, onPlanNextWeek, isPlanningNextWeek = false }) => {
  const [mode, setMode] = useState<AnalyticsMode>('planned');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const modeTasks = useMemo(() => {
    if (mode === 'completed') {
      return tasks.filter((t) => t.status === 'done');
    }

    if (mode === 'planned') {
      return tasks.filter((t) => !!t.due_date || t.status === 'todo' || t.status === 'doing');
    }

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

      return {
        name: format(date, 'EEE', { locale: es }),
        count: dayTasks.length,
        date,
      };
    }).reverse();
  }, [modeTasks, mode]);

  const totalCompleted = tasks.filter((t) => t.status === 'done').length;
  const weekPlanned = last7Days.reduce((acc, day) => acc + day.count, 0);
  const avgPerDay = (weekPlanned / 7).toFixed(1);
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const streak = calculateStreak(last7Days);
  const todayCount = last7Days[last7Days.length - 1]?.count ?? 0;
  const weeklyCompleted = tasks.filter((task) => {
    if (task.status !== 'done') return false;
    const completedDate = task.completed_at ? new Date(task.completed_at) : new Date(task.created_at);
    return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
  }).length;

  const weeklyCreated = tasks.filter((task) => {
    const createdDate = new Date(task.created_at);
    return isWithinInterval(createdDate, { start: weekStart, end: weekEnd });
  }).length;

  const carryOver = tasks.filter((task) => {
    if (task.status === 'done') return false;
    const createdDate = new Date(task.created_at);
    return createdDate < weekStart;
  }).length;

  const suggestedForNextWeek = tasks.filter((task) => task.status === 'backlog').length;

  const tooltipTextByMode: Record<AnalyticsMode, string> = {
    completed: 'tareas completadas',
    planned: 'tareas planificadas/activas',
    created: 'tareas creadas',
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong p-3 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">
            {format(payload[0].payload.date, 'd MMM', { locale: es })}
          </p>
          <p className="text-sm font-bold text-flow-accent">
            {payload[0].value} {tooltipTextByMode[mode]}
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
        <header className="space-y-2 shrink-0">
          <div className="flex items-center gap-2 text-flow-accent font-mono text-xs tracking-widest uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Rendimiento</span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Tu Flujo de Trabajo</h1>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {(['planned', 'completed', 'created'] as AnalyticsMode[]).map((entryMode) => (
              <button
                key={entryMode}
                onClick={() => setMode(entryMode)}
                className={`px-3 py-2 min-touch-target flex items-center justify-center rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all ${
                  mode === entryMode
                    ? 'bg-flow-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'bg-white/5 text-white/45 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                {MODE_LABELS[entryMode]}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
          <MetricCard
            icon={<Target className="w-4 h-4" />}
            label="Completadas"
            value={totalCompleted.toString()}
            sublabel="total"
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
            delay={0}
          />
          <MetricCard
            icon={<BarChart3 className="w-4 h-4" />}
            label={`${MODE_LABELS[mode]} semana`}
            value={weekPlanned.toString()}
            sublabel="últimos 7 días"
            color="text-flow-accent"
            bgColor="bg-flow-accent/10"
            delay={0.05}
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Promedio diario"
            value={avgPerDay}
            sublabel={MODE_LABELS[mode].toLowerCase() + '/día'}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
            delay={0.1}
          />
          <MetricCard
            icon={<Flame className="w-4 h-4" />}
            label="Racha"
            value={streak.toString()}
            sublabel={streak === 1 ? 'día' : 'días'}
            color="text-orange-400"
            bgColor="bg-orange-500/10"
            delay={0.15}
          />
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 pb-32">
          {/* Main Chart Column */}
          <div className="md:col-span-2 lg:col-span-8 glass rounded-3xl p-6 flex flex-col space-y-4 min-h-[300px] lg:min-h-[350px] group border-transparent hover:border-white/10 transition-colors relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-flow-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center justify-between shrink-0 relative z-10">
              <h3 className="text-lg font-display font-bold text-white/90">Actividad Semanal</h3>
              <div className="flex items-center gap-2 text-[10px] text-flow-accent/60 bg-flow-accent/10 px-3 py-1.5 rounded-full font-mono uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                <span>{MODE_LABELS[mode]} por día</span>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}
                    dy={12}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" radius={[6, 6, 2, 2]} barSize={38}>
                    {last7Days.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? 'var(--color-flow-accent)' : 'rgba(255,255,255,0.03)'}
                        fillOpacity={entry.count > 0 ? 0.95 : 0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight Column */}
          <div className="md:col-span-2 lg:col-span-4 glass rounded-3xl p-7 flex flex-col justify-between border-transparent hover:border-white/10 relative overflow-hidden group shadow-xl min-h-[250px] lg:min-h-[350px]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <Flame className="w-24 h-24 text-flow-accent blur-xl" />
            </div>
            
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-white/30 mb-4 relative z-10 border-b border-white/5 pb-4">Insight del Día</h4>
            
            <div className="flex-1 flex items-center justify-center relative z-10">
              <p className="text-white/80 text-xl font-display font-medium leading-relaxed">
                {todayCount >= 3 ? (
                  <>Hoy llevas <span className="text-flow-accent font-bold">{todayCount}</span> {MODE_LABELS[mode].toLowerCase()}. Vas muy bien, mantén ese ritmo para cerrar fuerte el día.</>
                ) : (
                  <>Hoy registras <span className="text-flow-accent font-bold">{todayCount}</span> {MODE_LABELS[mode].toLowerCase()}. Objetivo recomendado: llegar a 3 para sostener consistencia operativa.</>
                )}
              </p>
            </div>
          </div>

          {/* Revisión Automática */}
          <div className="md:col-span-2 lg:col-span-8 glass rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between group border-transparent hover:border-white/10 transition-colors relative overflow-hidden shadow-xl">
            <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-flow-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-white/50">Revisión Automática</h4>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-flow-accent mb-4 pl-5">
                {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM', { locale: es })}
              </p>
              <p className="text-sm text-white/40 leading-relaxed max-w-md">
                El sistema auto-planificador traslada prioritarias del backlog a 'Hoy' preparando tu próxima semana sin esfuerzo.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <StatBox label="Dones" value={weeklyCompleted} color="text-emerald-400" />
              <StatBox label="News" value={weeklyCreated} color="text-blue-400" />
              <StatBox label="Delay" value={carryOver} color="text-amber-400" />
              <StatBox label="Backlog" value={Math.min(suggestedForNextWeek, 3)} color="text-flow-accent" />
            </div>

            <div className="relative z-10 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
              <button
                disabled={!onPlanNextWeek || isPlanningNextWeek || suggestedForNextWeek === 0}
                onClick={() => onPlanNextWeek?.()}
                className="w-full lg:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-flow-accent text-white/60 hover:text-white border border-white/5 hover:border-transparent disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white/60 transition-all flex items-center justify-center gap-3 shadow-lg group/btn"
              >
                 <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                   {isPlanningNextWeek ? 'Planificando...' : 'Autoplanificar'}
                 </span>
                 <CheckCircle2 className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* Próximo Hito */}
          <div className="md:col-span-2 lg:col-span-4 glass rounded-3xl p-6 sm:p-8 flex flex-col justify-center relative group overflow-hidden border-transparent hover:border-emerald-500/20 transition-colors shadow-xl">
            <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/60 mb-6 relative z-10 border-b border-emerald-500/10 pb-4">Próximo Gran Hito</h4>
            <div className="flex items-end justify-between mb-4 relative z-10">
              <span className="text-3xl font-display font-bold tracking-tight text-white/90">50 Tareas</span>
              <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase bg-white/5 px-2 py-1 rounded-md">{totalCompleted} / 50</span>
            </div>
            
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden relative z-10 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalCompleted / 50) * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              />
            </div>
            
            <div className="flex items-center gap-3 mt-5 relative z-10 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">{pendingTasks} pendientes para alcanzarlo</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function MetricCard({ icon, label, value, sublabel, color, bgColor, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: string;
  bgColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-xl p-5 space-y-3 flex flex-col justify-between group hover:border-white/15 transition-all duration-300"
    >
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ y: -2, scale: 1.08, rotate: -3 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center ${color} transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]`}
        >
          {icon}
        </motion.div>
        <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{label}</span>
      </div>
      <div className="space-y-1">
        <p className={`text-4xl font-display font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-white/25">{sublabel}</p>
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
    <div className="flex-1 rounded-2xl bg-white/5 px-4 py-3 flex flex-col justify-center min-w-[80px] border border-transparent hover:border-white/10 transition-colors shadow-inner">
      <p className="text-[9px] uppercase tracking-widest text-white/35 mb-1">{label}</p>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}
