import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, AlertCircle, CalendarDays, Clock } from 'lucide-react';
import { Task, Project } from '../types';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths,
  startOfWeek, endOfWeek, addDays, isWithinInterval, isBefore,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  weekStartsOn: 0 | 1;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks, projects, onTaskClick, weekStartsOn,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const calendarStart = startOfWeek(start, { weekStartsOn });
    return eachDayOfInterval({ start: calendarStart, end: addDays(calendarStart, 41) });
  }, [currentDate, weekStartsOn]);

  const weekDays = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return weekStartsOn === 1 ? [...days.slice(1), days[0]] : days;
  }, [weekStartsOn]);

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
    tasks.filter((t) => {
      if (!t.due_date) return false;
      return isSameDay(parseDate(t.due_date), day);
    });

  const getProjectColor = (projectId?: string) => {
    if (!projectId) return '#3b82f6';
    return projects.find((p) => p.id === projectId)?.color || '#3b82f6';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.name || null;
  };

  // Max tasks in any day of current month (for load indicator scaling)
  const maxDayLoad = useMemo(() => {
    const counts = calendarDays
      .filter((d) => isSameMonth(d, currentDate))
      .map((d) => getTasksForDay(d).length);
    return Math.max(...counts, 1);
  }, [calendarDays, tasks, currentDate]);

  // Month stats
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = parseDate(t.due_date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && isBefore(parseDate(t.due_date), new Date()),
  );
  const unscheduled = tasks.filter((t) => !t.due_date && t.status !== 'done');

  // Week stats
  const weekStart = startOfWeek(new Date(), { weekStartsOn });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn });
  const weekTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = parseDate(t.due_date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setCurrentDate((prev) => dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const statusColor = (status: string) => {
    if (status === 'done') return 'text-emerald-400';
    if (status === 'doing') return 'text-amber-400';
    if (status === 'todo') return 'text-flow-accent';
    return 'text-white/30';
  };

  return (
    <div className="h-full flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.h2
                key={format(currentDate, 'MMMM yyyy')}
                initial={{ opacity: 0, y: direction > 0 ? -12 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction > 0 ? 12 : -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl md:text-3xl font-display font-bold capitalize"
              >
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </motion.h2>
            </AnimatePresence>
            <button
              onClick={() => { setDirection(1); setCurrentDate(new Date()); }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
            >
              Hoy
            </button>
          </div>

          {/* Month summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-flow-accent/70 bg-flow-accent/[0.08] border border-flow-accent/[0.12] px-2.5 py-1 rounded-full">
              <CalendarDays className="w-3 h-3" />
              {monthTasks.length} este mes
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-white/40 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {weekTasks.length} esta semana
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

        {/* Navigation */}
        <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/[0.05]">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 glass rounded-2xl p-3 sm:p-5 flex flex-col overflow-hidden border border-white/[0.04]">

        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center py-2 text-[10px] font-mono uppercase tracking-widest text-white/25">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5"
          >
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
                  onMouseEnter={() => setHoveredDay(dayKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`relative flex flex-col rounded-xl border transition-all duration-200 overflow-visible
                    ${!isCurrentMonth ? 'opacity-[0.15] pointer-events-none' : ''}
                    ${isDayToday
                      ? 'border-flow-accent/40 bg-flow-accent/[0.06] shadow-[0_0_16px_rgba(59,130,246,0.12)]'
                      : isHovered && isCurrentMonth
                        ? 'border-white/10 bg-white/[0.05]'
                        : 'border-white/[0.03] bg-white/[0.02]'}
                  `}
                  style={{ minHeight: 0 }}
                >
                  {/* Top load indicator bar */}
                  {dayTasks.length > 0 && isCurrentMonth && (
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                      style={{
                        backgroundColor: hasOverdue ? '#f87171' : isDayToday ? '#3b82f6' : '#3b82f680',
                        width: `${Math.max(loadPct * 100, 20)}%`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  )}

                  <div className="p-1 sm:p-2 flex flex-col gap-1 h-full">
                    {/* Day number */}
                    <div className="flex items-center justify-between shrink-0">
                      <span
                        className={`text-[11px] sm:text-xs font-mono font-semibold leading-none
                          ${isDayToday
                            ? 'w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-flow-accent text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] text-[10px]'
                            : hasOverdue
                              ? 'text-red-400/70'
                              : isCurrentMonth
                                ? 'text-white/60'
                                : 'text-white/20'}
                        `}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className={`text-[9px] font-mono leading-none ${hasOverdue ? 'text-red-400/50' : 'text-white/20'
                          }`}>
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    {/* Task pills */}
                    <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                      {dayTasks.slice(0, 3).map((task) => {
                        const color = getProjectColor(task.project_id);
                        const isDone = task.status === 'done';
                        return (
                          <motion.button
                            key={task.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onTaskClick(task)}
                            className="w-full text-left flex items-center gap-1 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md transition-all group"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <div
                              className="w-1 h-2 sm:h-2.5 rounded-full shrink-0 transition-opacity"
                              style={{
                                backgroundColor: color,
                                opacity: isDone ? 0.4 : 1,
                              }}
                            />
                            <span
                              className="truncate text-[9px] sm:text-[10px] font-medium leading-none transition-colors group-hover:text-white/90"
                              style={{
                                color: isDone ? 'rgba(255,255,255,0.25)' : color,
                                textDecoration: isDone ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </span>
                          </motion.button>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] font-mono text-white/30 px-1 sm:px-1.5">
                          +{dayTasks.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover tooltip — shows all tasks if more than 3 */}
                  <AnimatePresence>
                    {isHovered && dayTasks.length > 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-0 top-full mt-1 w-52 glass rounded-xl border border-white/10 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.6)] pointer-events-none"
                        style={{ minWidth: '200px' }}
                      >
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">
                          {format(day, 'd MMM', { locale: es })} · {dayTasks.length} tareas
                        </p>
                        <div className="space-y-1.5">
                          {dayTasks.map((task) => {
                            const color = getProjectColor(task.project_id);
                            const projName = getProjectName(task.project_id);
                            return (
                              <div key={task.id} className="flex items-start gap-2">
                                <div
                                  className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <div className="min-w-0">
                                  <p className={`text-[11px] leading-tight ${statusColor(task.status)}`}>
                                    {task.title}
                                  </p>
                                  {projName && (
                                    <p className="text-[9px] font-mono mt-0.5" style={{ color: `${color}80` }}>
                                      {projName}
                                    </p>
                                  )}
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      <div className="glass rounded-xl px-5 py-3 flex items-center justify-between border border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-flow-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[11px] font-mono text-white/40">Hoy</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-[11px] font-mono text-white/40">
            <span className="text-flow-accent font-semibold">{monthTasks.length}</span> tareas en {format(currentDate, 'MMMM', { locale: es })}
          </span>
          {overdueTasks.length > 0 && (
            <>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[11px] font-mono text-red-400/60">
                <span className="text-red-400 font-semibold">{overdueTasks.length}</span> vencidas
              </span>
            </>
          )}
        </div>

        {/* Load legend */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/20">carga</span>
          <div className="flex items-center gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
              <div
                key={v}
                className="w-3 h-1.5 rounded-full"
                style={{ backgroundColor: `rgba(59,130,246,${v * 0.8})` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-white/20">alta</span>
        </div>
      </div>
    </div>
  );
};