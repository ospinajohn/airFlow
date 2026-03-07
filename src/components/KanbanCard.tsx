import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { Calendar, Clock, Trash2, Flag, Play } from 'lucide-react';
import { Task, Project } from '../types';

const STATUS_COLORS: Record<string, string> = {
  backlog: '#6B7280',
  todo: '#3B82F6',
  doing: '#F59E0B',
  done: '#10B981',
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string; bg: string; glow: string }> = {
  1: { label: 'Baja', color: 'text-white/30', bg: 'bg-white/5', glow: '' },
  2: { label: 'Media', color: 'text-amber-400', bg: 'bg-amber-500/10', glow: '0 0 8px rgba(245,158,11,0.3)' },
  3: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10', glow: '0 0 10px rgba(239,68,68,0.4)' },
};

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete?: (id: string) => void;
  projects?: Project[];
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onClick,
  onDelete,
  projects = [],
  selected = false,
  onToggleSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [timeUntilDue, setTimeUntilDue] = useState<string | null>(null);

  const project = projects.find(p => p.id === task.project_id);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[1];
  const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.backlog;

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

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeUntilDue(`${days}d`);
      } else if (hours > 0) {
        setTimeUntilDue(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilDue(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [task.due_date]);

  const isOverdue = timeUntilDue === 'Vencido';

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-xl bg-flow-card/80 border transition-all duration-200 cursor-grab active:cursor-grabbing touch-none hover:shadow-lg hover:shadow-black/30 backdrop-blur-sm ${
        selected
          ? 'border-flow-accent/70 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]'
          : 'border-white/[0.06] hover:border-white/[0.14]'
      }`}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-200 group-hover:top-2 group-hover:bottom-2"
        style={{ backgroundColor: statusColor, opacity: 0.6 }}
      />

      <div className="p-3.5 pl-4">
        {onToggleSelect && (
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(task.id);
            }}
            className={`absolute top-2 left-2 w-4 h-4 rounded border transition-all ${
              selected
                ? 'bg-flow-accent border-flow-accent shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                : 'bg-black/20 border-white/20 opacity-0 group-hover:opacity-100'
            }`}
            title={selected ? 'Deseleccionar' : 'Seleccionar'}
          >
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto" />}
          </button>
        )}

        {/* Project badge + Priority glow dot */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {project && (
              <>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#3b82f6' }} />
                <span className="text-[10px] font-medium text-white/35 truncate">{project.name}</span>
              </>
            )}
          </div>
          
          {/* Priority glow dot */}
          {task.priority === 3 && (
            <motion.div
              animate={{ 
                boxShadow: ['0 0 4px rgba(239,68,68,0.4)', '0 0 12px rgba(239,68,68,0.7)', '0 0 4px rgba(239,68,68,0.4)'],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
            />
          )}
          {task.priority === 2 && (
            <motion.div
              animate={{ 
                boxShadow: ['0 0 3px rgba(245,158,11,0.3)', '0 0 8px rgba(245,158,11,0.6)', '0 0 3px rgba(245,158,11,0.3)'],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
            />
          )}
        </div>

        {/* Title */}
        <div
          onClick={(e) => { e.stopPropagation(); onClick(task); }}
          className="cursor-pointer"
        >
          <h4 className="text-[13px] font-medium leading-snug text-white/90 group-hover:text-white transition-colors pr-6">
            {task.title}
          </h4>
        </div>

        {/* Properties row */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {task.due_date && (
            <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-white/[0.04] text-white/35'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}

          {timeUntilDue && (
            <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
              isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-flow-accent/10 text-flow-accent/70'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{timeUntilDue}</span>
            </div>
          )}

          {task.priority >= 2 && (
            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${priority.bg} ${priority.color}`}>
              <Flag className="w-3 h-3" />
              <span className="font-medium">{priority.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(task); }}
          className="p-1.5 rounded-lg hover:bg-flow-accent/20 text-white/20 hover:text-flow-accent transition-colors"
          title="Iniciar focus"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
