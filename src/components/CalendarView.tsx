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
            className="text-xl md:text-3xl font-display font-bold capitalize"
          >
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </motion.h2>
          
          <button
            onClick={goToToday}
            className="px-3 py-2 min-touch-target flex items-center justify-center rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-all font-mono uppercase tracking-widest"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={previousMonth}
            className="p-2 min-touch-target flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-white/40 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 min-touch-target flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-white/40 hover:text-white"
          >
            <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 glass rounded-2xl p-3 sm:p-6 overflow-hidden flex flex-col">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-1 sm:mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center py-2 sm:py-3 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-white/40"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 sm:gap-3 pt-1 sm:pt-2">
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
                  className={`relative p-1 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col gap-1 sm:gap-2 transition-all duration-300 border border-transparent ${
                    isCurrentMonth 
                      ? 'bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 hover:shadow-xl hover:-translate-y-1' 
                      : 'opacity-10 pointer-events-none'
                  } ${isDayToday ? 'ring-2 ring-flow-accent/50 bg-flow-accent/[0.05] shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''}`}
                >
                  {/* Glowing orbital on hover for days with tasks */}
                  {dayTasks.length > 0 && (
                     <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 70%)' }} />
                  )}

                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-0.5 z-10 relative">
                    <span
                      className={`text-xs sm:text-sm font-display ${
                        isDayToday
                          ? 'w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-flow-accent text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                          : isCurrentMonth
                          ? 'text-white/80 font-medium'
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
                  <div className="flex flex-col gap-1.5 overflow-hidden z-10 relative mt-auto">
                    {dayTasks.slice(0, 3).map((task, idx) => {
                      const projColor = getProjectColor(task.project_id);
                      return (
                        <motion.button
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + idx * 0.02 }}
                          onClick={() => onTaskClick(task)}
                          className="group w-full text-left px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-semibold truncate transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-start gap-1 sm:gap-2 border border-transparent hover:border-white/10 min-h-[22px] sm:min-h-[28px]"
                          style={{
                            backgroundColor: `${projColor}1A`, // 10% opacity
                            color: projColor,
                          }}
                        >
                          <div className="w-1 h-2 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: projColor }} />
                          <span className="truncate group-hover:text-white transition-colors">
                            {task.title}
                          </span>
                        </motion.button>
                      );
                    })}
                    
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] sm:text-[10px] font-mono text-white/40 px-1 sm:px-2 py-0.5 mt-0.5 sm:mt-1 bg-white/5 rounded-md inline-block w-fit">
                        +{dayTasks.length - 3}
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
