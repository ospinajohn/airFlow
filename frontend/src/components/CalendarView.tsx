import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, AlertCircle,
  CalendarDays, Clock, LayoutGrid, List,
} from 'lucide-react';
import { Task, Project } from '../types';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths,
  startOfWeek, endOfWeek, addDays, subDays, isWithinInterval,
  isBefore, addWeeks, subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  weekStartsOn: 0 | 1;
}

type CalendarMode = 'week' | 'month';

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks, projects, onTaskClick, weekStartsOn,
}) => {
  const [mode, setMode] = useState<CalendarMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // ── Shared utils ─────────────────────────────────────────────────────────

  const parseDate = (str: string): Date => {
    if (!str) return new Date('invalid');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str))
      return new Date(str.replace(' ', 'T') + 'Z');
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(str);
  };

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(parseDate(t.dueDate), day));

  const getProjectColor = (id?: string) =>
    id ? (projects.find((p) => p.id === id)?.color || '#3b82f6') : '#3b82f6';

  const getProjectName = (id?: string) =>
    id ? (projects.find((p) => p.id === id)?.name || null) : null;

  const statusLabel: Record<string, string> = {
    backlog: 'Pendiente', todo: 'Hoy', doing: 'En proceso', done: 'Hecho',
  };
  const statusCls: Record<string, string> = {
    backlog: 'text-white/30 bg-white/[0.04] border-white/[0.06]',
    todo: 'text-flow-accent/80 bg-flow-accent/10 border-flow-accent/15',
    doing: 'text-amber-400/80 bg-amber-500/10 border-amber-500/15',
    done: 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/15',
  };

  // ── Global stats ──────────────────────────────────────────────────────────

  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isBefore(parseDate(t.dueDate), new Date()),
  );
  const weekTasksAll = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return isWithinInterval(parseDate(t.dueDate), { start: weekStart, end: weekEnd });
  });
  const monthTasksAll = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return isWithinInterval(parseDate(t.dueDate), { start: monthStart, end: monthEnd });
  });
  const unscheduled = tasks.filter((t) => !t.dueDate && t.status !== 'done');

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setCurrentDate((prev) =>
      mode === 'week'
        ? dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)
        : dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1),
    );
  };

  const goToToday = () => { setDirection(1); setCurrentDate(new Date()); };

  // ── Week days ─────────────────────────────────────────────────────────────

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // ── Month grid ────────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn });
    return eachDayOfInterval({ start, end: addDays(start, 41) });
  }, [currentDate, weekStartsOn]);

  const weekDayLabels = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return weekStartsOn === 1 ? [...days.slice(1), days[0]] : days;
  }, [weekStartsOn]);

  const maxDayLoad = useMemo(() => {
    const counts = calendarDays
      .filter((d) => isSameMonth(d, currentDate))
      .map((d) => getTasksForDay(d).length);
    return Math.max(...counts, 1);
  }, [calendarDays, tasks, currentDate]);

  // ── Period label ──────────────────────────────────────────────────────────

  const periodLabel = mode === 'month'
    ? format(currentDate, 'MMMM yyyy', { locale: es })
    : `${format(weekStart, 'd MMM', { locale: es })} — ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;

  return (
    <div className="h-full flex flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            <motion.h2
              key={periodLabel}
              initial={{ opacity: 0, y: direction > 0 ? -10 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? 10 : -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-3xl font-display font-bold capitalize"
            >
              {periodLabel}
            </motion.h2>
          </AnimatePresence>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
            >
              Hoy
            </button>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-flow-accent/70 bg-flow-accent/[0.08] border border-flow-accent/[0.12] px-2.5 py-1 rounded-full">
              <CalendarDays className="w-3 h-3" />
              {mode === 'week' ? `${weekTasksAll.length} esta semana` : `${monthTasksAll.length} este mes`}
            </span>
            {overdueTasks.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-red-400/70 bg-red-500/[0.08] border border-red-500/[0.12] px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                {overdueTasks.length} vencidas
              </span>
            )}
            {unscheduled.length > 0 && (
              <span className="text-[11px] font-mono text-white/25 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-full">
                {unscheduled.length} sin fecha
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mode toggle */}
          <div className="glass rounded-xl p-1 flex items-center gap-1 border border-white/[0.05]">
            <button
              onClick={() => setMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${mode === 'week' ? 'bg-flow-accent/20 text-flow-accent' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              Semana
            </button>
            <button
              onClick={() => setMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${mode === 'month' ? 'bg-flow-accent/20 text-flow-accent' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Mes
            </button>
          </div>

          {/* Navigation */}
          <div className="glass rounded-xl p-1 flex items-center gap-1 border border-white/[0.05]">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {mode === 'week' ? (
          <WeekView
            key={`week-${format(weekStart, 'yyyy-MM-dd')}`}
            weekDays={weekDays}
            direction={direction}
            getTasksForDay={getTasksForDay}
            getProjectColor={getProjectColor}
            getProjectName={getProjectName}
            statusLabel={statusLabel}
            statusCls={statusCls}
            onTaskClick={onTaskClick}
          />
        ) : (
          <MonthView
            key={`month-${format(currentDate, 'yyyy-MM')}`}
            calendarDays={calendarDays}
            weekDayLabels={weekDayLabels}
            currentDate={currentDate}
            direction={direction}
            maxDayLoad={maxDayLoad}
            hoveredDay={hoveredDay}
            setHoveredDay={setHoveredDay}
            getTasksForDay={getTasksForDay}
            getProjectColor={getProjectColor}
            getProjectName={getProjectName}
            statusLabel={statusLabel}
            onTaskClick={onTaskClick}
          />
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <div className="glass rounded-xl px-4 py-2.5 flex items-center justify-between border border-white/[0.04]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-flow-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[11px] font-mono text-white/40">Hoy</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          {[
            { dot: '#3b82f6', label: 'Hoy' },
            { dot: '#f59e0b', label: 'En proceso' },
            { dot: '#10b981', label: 'Hecho' },
            { dot: 'rgba(255,255,255,0.2)', label: 'Pendiente' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
              <span className="text-[10px] font-mono text-white/30">{item.label}</span>
            </div>
          ))}
        </div>
        <span className="text-[11px] font-mono text-white/25 hidden sm:block">
          {tasks.filter((t) => t.dueDate).length} programadas en total
        </span>
      </div>
    </div>
  );
};

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  weekDays, direction, getTasksForDay, getProjectColor, getProjectName,
  statusLabel, statusCls, onTaskClick,
}: {
  weekDays: Date[];
  direction: 1 | -1;
  getTasksForDay: (d: Date) => Task[];
  getProjectColor: (id?: string) => string;
  getProjectName: (id?: string) => string | null;
  statusLabel: Record<string, string>;
  statusCls: Record<string, string>;
  onTaskClick: (t: Task) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 grid grid-cols-7 gap-2 overflow-hidden"
    >
      {weekDays.map((day, i) => {
        const dayTasks = getTasksForDay(day);
        const isDayToday = isToday(day);
        const hasOverdue = dayTasks.some(
          (t) => t.status !== 'done' && isBefore(day, new Date()) && !isDayToday,
        );

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={`flex flex-col rounded-2xl border overflow-hidden transition-all ${isDayToday
                ? 'border-flow-accent/30 bg-flow-accent/[0.04] shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                : hasOverdue
                  ? 'border-red-500/15 bg-red-500/[0.02]'
                  : 'border-white/[0.04] bg-white/[0.02]'
              }`}
          >
            {/* Day header */}
            <div className={`px-2 py-2.5 border-b flex flex-col items-center gap-0.5 shrink-0 ${isDayToday ? 'border-flow-accent/20 bg-flow-accent/[0.06]' : 'border-white/[0.04]'
              }`}>
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className={`font-display font-bold leading-none ${isDayToday
                  ? 'text-flow-accent text-lg'
                  : hasOverdue
                    ? 'text-red-400/70 text-base'
                    : 'text-white/70 text-base'
                }`}>
                {format(day, 'd')}
              </span>
              {dayTasks.length > 0 && (
                <span className={`text-[9px] font-mono rounded-full px-1.5 py-0.5 ${isDayToday
                    ? 'bg-flow-accent/20 text-flow-accent'
                    : hasOverdue
                      ? 'bg-red-500/15 text-red-400/60'
                      : 'bg-white/5 text-white/25'
                  }`}>
                  {dayTasks.length}
                </span>
              )}
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-1.5 space-y-1">
              {dayTasks.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-1 h-8 rounded-full bg-white/[0.04]" />
                </div>
              ) : (
                dayTasks.map((task, ti) => {
                  const color = getProjectColor(task.projectId);
                  const projName = getProjectName(task.projectId);
                  const isDone = task.status === 'done';
                  return (
                    <motion.button
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ti * 0.04 }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onTaskClick(task)}
                      className="w-full text-left rounded-xl p-2 border border-transparent hover:border-white/10 transition-all group relative overflow-hidden"
                      style={{ backgroundColor: `${color}12` }}
                    >
                      {/* Left accent */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                        style={{ backgroundColor: color, opacity: isDone ? 0.3 : 0.8 }}
                      />
                      <div className="pl-2">
                        <p
                          className="text-[10px] sm:text-[11px] font-medium leading-tight transition-colors group-hover:text-white/90 line-clamp-2"
                          style={{
                            color: isDone ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {projName && (
                            <span className="text-[9px] font-mono truncate max-w-[80px]" style={{ color: `${color}80` }}>
                              {projName}
                            </span>
                          )}
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${statusCls[task.status] ?? statusCls.backlog}`}>
                            {statusLabel[task.status] ?? task.status}
                          </span>
                          {task.priority === 3 && (
                            <span className="text-[9px] font-mono text-red-400/70 bg-red-500/10 border border-red-500/15 px-1.5 py-0.5 rounded-full">P3</span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({
  calendarDays, weekDayLabels, currentDate, direction, maxDayLoad,
  hoveredDay, setHoveredDay, getTasksForDay, getProjectColor, getProjectName,
  statusLabel, onTaskClick,
}: {
  calendarDays: Date[];
  weekDayLabels: string[];
  currentDate: Date;
  direction: 1 | -1;
  maxDayLoad: number;
  hoveredDay: string | null;
  setHoveredDay: (k: string | null) => void;
  getTasksForDay: (d: Date) => Task[];
  getProjectColor: (id?: string) => string;
  getProjectName: (id?: string) => string | null;
  statusLabel: Record<string, string>;
  onTaskClick: (t: Task) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 glass rounded-2xl p-2 sm:p-4 flex flex-col overflow-hidden border border-white/[0.04]"
    >
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDayLabels.map((d) => (
          <div key={d} className="text-center py-2 text-[10px] font-mono uppercase tracking-widest text-white/25">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1">
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const dayKey = day.toISOString();
          const loadPct = dayTasks.length / maxDayLoad;
          const hasOverdue = dayTasks.some(
            (t) => t.status !== 'done' && isBefore(day, new Date()) && !isDayToday,
          );
          const isHovered = hoveredDay === dayKey;

          return (
            <motion.div
              key={dayKey}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.002 }}
              onMouseEnter={() => isCurrentMonth && setHoveredDay(dayKey)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`relative flex flex-col rounded-xl border transition-all duration-200 overflow-visible
                ${!isCurrentMonth ? 'opacity-[0.12] pointer-events-none' : ''}
                ${isDayToday
                  ? 'border-flow-accent/35 bg-flow-accent/[0.05] shadow-[0_0_14px_rgba(59,130,246,0.1)]'
                  : isHovered
                    ? 'border-white/10 bg-white/[0.05]'
                    : hasOverdue
                      ? 'border-red-500/10 bg-red-500/[0.02]'
                      : 'border-white/[0.03] bg-white/[0.015]'}
              `}
            >
              {/* Load bar */}
              {dayTasks.length > 0 && isCurrentMonth && (
                <div
                  className="absolute top-0 left-0 h-0.5 rounded-t-xl transition-all duration-500"
                  style={{
                    width: `${Math.max(loadPct * 100, 15)}%`,
                    backgroundColor: hasOverdue ? '#f87171' : isDayToday ? '#3b82f6' : '#3b82f650',
                  }}
                />
              )}

              <div className="p-1 sm:p-1.5 flex flex-col h-full gap-0.5">
                {/* Day number */}
                <div className="flex items-center justify-between shrink-0">
                  <span className={`text-[11px] font-mono font-semibold leading-none
                    ${isDayToday ? 'w-5 h-5 flex items-center justify-center rounded-full bg-flow-accent text-white text-[10px] shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                      : hasOverdue ? 'text-red-400/60'
                        : isCurrentMonth ? 'text-white/55' : 'text-white/15'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className={`text-[9px] font-mono ${hasOverdue ? 'text-red-400/40' : 'text-white/15'}`}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Pills */}
                <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const color = getProjectColor(task.projectId);
                    const isDone = task.status === 'done';
                    return (
                      <motion.button
                        key={task.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onTaskClick(task)}
                        className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded-md group"
                        style={{ backgroundColor: `${color}12` }}
                      >
                        <div className="w-1 h-2 rounded-full shrink-0" style={{ backgroundColor: color, opacity: isDone ? 0.3 : 0.9 }} />
                        <span
                          className="truncate text-[9px] sm:text-[10px] font-medium leading-none group-hover:text-white/90 transition-colors"
                          style={{ color: isDone ? 'rgba(255,255,255,0.2)' : color, textDecoration: isDone ? 'line-through' : 'none' }}
                        >
                          {task.title}
                        </span>
                      </motion.button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] font-mono text-white/25 px-1">+{dayTasks.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && dayTasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 left-0 top-full mt-1 w-56 glass rounded-xl border border-white/10 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.7)] pointer-events-none"
                  >
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">
                      {format(day, 'd MMM', { locale: es })} · {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
                    </p>
                    <div className="space-y-2">
                      {dayTasks.map((task) => {
                        const color = getProjectColor(task.projectId);
                        const projName = getProjectName(task.projectId);
                        return (
                          <div key={task.id} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
                            <div className="min-w-0">
                              <p className="text-[11px] text-white/70 leading-tight">{task.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {projName && (
                                  <span className="text-[9px] font-mono" style={{ color: `${color}70` }}>{projName}</span>
                                )}
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${task.status === 'done' ? 'text-emerald-400/70 bg-emerald-500/10 border-emerald-500/15'
                                    : task.status === 'doing' ? 'text-amber-400/70 bg-amber-500/10 border-amber-500/15'
                                      : task.status === 'todo' ? 'text-flow-accent/70 bg-flow-accent/10 border-flow-accent/15'
                                        : 'text-white/25 bg-white/[0.04] border-white/[0.06]'
                                  }`}>
                                  {statusLabel[task.status] ?? task.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}