import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, Trash2, Flag, Play } from 'lucide-react';
import { Task, Project } from '../types';

const STATUS_COLORS: Record<string, string> = {
  backlog: '#6B7280',
  todo: '#3B82F6',
  doing: '#F59E0B',
  done: '#10B981',
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Baja', color: 'text-white/30', bg: 'bg-white/5' },
  2: { label: 'Media', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  3: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10' },
};

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete?: (id: string) => void;
  projects?: Project[];
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick, onDelete, projects = [] }) => {
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
      className="group relative rounded-lg bg-flow-card border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-grab active:cursor-grabbing touch-none hover:shadow-lg hover:shadow-black/20"
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity duration-200"
        style={{ backgroundColor: statusColor, opacity: 0.6 }}
      />

      <div className="p-3 pl-4">
        {/* Project badge */}
        {project && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#3b82f6' }} />
            <span className="text-[10px] font-medium text-white/40 truncate">{project.name}</span>
          </div>
        )}

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
            <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/40'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}

          {timeUntilDue && (
            <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
              isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-flow-accent/10 text-flow-accent/80'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{timeUntilDue}</span>
            </div>
          )}

          {task.priority >= 2 && (
            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${priority.bg} ${priority.color}`}>
              <Flag className="w-3 h-3" />
              <span className="font-medium">{priority.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(task); }}
          className="p-1 rounded-md hover:bg-flow-accent/20 text-white/20 hover:text-flow-accent transition-colors"
          title="Iniciar focus"
        >
          <Play className="w-3 h-3" />
        </button>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded-md hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
