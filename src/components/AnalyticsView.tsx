import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Target, Flame, Calendar, CheckCircle2 } from 'lucide-react';
import { Task } from '../types';
import { format, subDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsViewProps {
  tasks: Task[];
}

interface ChartPoint {
  name: string;
  count: number;
  date: Date;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks }) => {
  const completedTasks = tasks.filter(t => t.status === 'done');

  const last7Days: ChartPoint[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayTasks = tasks.filter(t => {
      const sourceDate = t.due_date || t.created_at;
      if (!sourceDate) return false;
      return isSameDay(new Date(sourceDate), date);
    });

    return {
      name: format(date, 'EEE', { locale: es }),
      count: dayTasks.length,
      date,
    };
  }).reverse();

  const totalCompleted = completedTasks.length;
  const weekPlanned = last7Days.reduce((acc, day) => acc + day.count, 0);
  const avgPerDay = (weekPlanned / 7).toFixed(1);
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const streak = calculateStreak(last7Days);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong p-3 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">
            {format(payload[0].payload.date, 'd MMM', { locale: es })}
          </p>
          <p className="text-sm font-bold text-flow-accent">
            {payload[0].value} {payload[0].value === 1 ? 'tarea del día' : 'tareas del día'}
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
      className="h-full p-12 pl-24 overflow-y-auto no-scrollbar"
    >
      <div className="max-w-5xl mx-auto space-y-12 pb-32">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-flow-accent font-mono text-xs tracking-widest uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Rendimiento</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Tu Flujo de Trabajo</h1>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            label="Esta semana"
            value={weekPlanned.toString()}
            sublabel="tareas planificadas"
            color="text-flow-accent"
            bgColor="bg-flow-accent/10"
            delay={0.05}
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Promedio diario"
            value={avgPerDay}
            sublabel="tareas/día"
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

        <div className="glass rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-white/80">Actividad Semanal</h3>
            <div className="flex items-center gap-2 text-[10px] text-white/20 font-mono uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              <span>Tareas por día</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={34}>
                  {last7Days.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? 'var(--color-flow-accent)' : 'rgba(255,255,255,0.05)'}
                      fillOpacity={entry.count > 0 ? 0.9 : 0.55}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-mono uppercase tracking-widest text-white/40">Insight del Día</h4>
            <p className="text-white/80 leading-relaxed">
              {weekPlanned > 10
                ? '¡Estás en racha! Tu productividad ha subido un 15% respecto a la semana pasada. Mantén el ritmo.'
                : 'Parece que estás empezando. Enfócate en completar al menos 3 tareas hoy para establecer un hábito sólido.'}
            </p>
          </div>
          <div className="glass rounded-2xl p-6 space-y-4 border-flow-accent/20">
            <h4 className="text-sm font-mono uppercase tracking-widest text-flow-accent/60">Próximo Hito</h4>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-display font-bold">50 Tareas</span>
              <span className="text-xs text-white/40">{totalCompleted}/50</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalCompleted / 50) * 100, 100)}%` }}
                className="h-full bg-flow-accent"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-white/35">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{pendingTasks} tareas pendientes por completar</span>
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
      className="glass rounded-xl p-5 space-y-3 group hover:border-white/15 transition-all duration-300"
    >
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ y: -2, scale: 1.08, rotate: -3 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center ${color} transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]`}
        >
          <motion.div
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {icon}
          </motion.div>
        </motion.div>
        <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{label}</span>
      </div>
      <div className="space-y-1">
        <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
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
