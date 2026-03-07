import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Task, Project } from '../types';
import { format, startOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  weekStartsOn: 0 | 1; // 0 = Domingo, 1 = Lunes
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, projects, onTaskClick, weekStartsOn }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);

    // Build a deterministic 6-row grid (42 days) to keep layout stable.
    const calendarStart = startOfWeek(start, { weekStartsOn });
    const calendarEnd = addDays(calendarStart, 41);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, weekStartsOn]);

  // Dynamic week days based on start preference
  const weekDays = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    if (weekStartsOn === 1) {
      // Start on Monday: rotate array
      return [...days.slice(1), days[0]];
    }
    return days; // Start on Sunday
  }, [weekStartsOn]);

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return isSameDay(taskDate, day);
    });
  };

  const getProjectColor = (projectId?: string) => {
    if (!projectId) return '#3b82f6';
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#3b82f6';
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const previousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.h2 
            key={format(currentDate, 'MMMM yyyy', { locale: es })}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold capitalize"
          >
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </motion.h2>
          
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-all"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-white/5 transition-all text-white/40 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-white/5 transition-all text-white/40 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 glass rounded-2xl p-6 overflow-hidden flex flex-col">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center py-3 text-[10px] font-mono uppercase tracking-widest text-white/30"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-white/5 rounded-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {calendarDays.map((day, index) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              
              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.003 }}
                  className={`bg-flow-card p-3 flex flex-col gap-2 relative transition-all hover:bg-white/5 ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-mono ${
                        isDayToday
                          ? 'w-7 h-7 flex items-center justify-center rounded-full bg-flow-accent text-white font-bold'
                          : isCurrentMonth
                          ? 'text-white/70'
                          : 'text-white/20'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-mono text-white/20">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Pills */}
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task, idx) => (
                      <motion.button
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + idx * 0.02 }}
                        onClick={() => onTaskClick(task)}
                        className="group w-full text-left px-2 py-1 rounded-md text-[10px] font-medium truncate transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          backgroundColor: `${getProjectColor(task.project_id)}15`,
                          color: getProjectColor(task.project_id),
                          borderLeft: `2px solid ${getProjectColor(task.project_id)}`,
                        }}
                      >
                        <span className="group-hover:text-white transition-colors">
                          {task.title}
                        </span>
                      </motion.button>
                    ))}
                    
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-white/30 font-mono px-2">
                        +{dayTasks.length - 3} más
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="glass rounded-xl px-6 py-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-flow-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-white/50">Hoy</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-2 text-xs font-mono">
          <CalendarIcon className="w-3.5 h-3.5 text-white/40" />
          <span className="text-white/50">
            <span className="text-flow-accent font-semibold">{tasks.filter(t => t.due_date).length}</span> tareas programadas
          </span>
        </div>
      </div>
    </div>
  );
};
