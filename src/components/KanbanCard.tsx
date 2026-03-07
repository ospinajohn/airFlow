import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Task } from '../types';

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [timeUntilDue, setTimeUntilDue] = useState<string | null>(null);

  useEffect(() => {
    if (!task.due_date) {
      setTimeUntilDue(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const due = new Date(task.due_date!).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setTimeUntilDue('Vencido');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        setTimeUntilDue(`${Math.floor(hours / 24)}d`);
      } else if (hours > 0) {
        setTimeUntilDue(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilDue(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [task.due_date]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 glass rounded-xl space-y-3 hover:border-white/20 transition-colors cursor-grab active:cursor-grabbing group relative touch-none"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}>
        <h4 className="text-sm font-medium group-hover:text-flow-accent transition-colors pr-6">{task.title}</h4>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {task.due_date && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] text-white/40 font-mono flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </div>
              {timeUntilDue && (
                <motion.div 
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`text-[9px] font-bold font-mono flex items-center gap-1 px-1.5 py-0.5 rounded ${
                    timeUntilDue === 'Vencido' ? 'bg-red-500/20 text-red-400' : 'bg-flow-accent/10 text-flow-accent'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {timeUntilDue}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-between items-center border-t border-white/5">
        <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">
          {task.status}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick(task);
          }}
          className="text-[10px] text-flow-accent opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-tighter"
        >
          Iniciar →
        </button>
      </div>
    </div>
  );
};
