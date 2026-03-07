import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, Clock } from 'lucide-react';
import { Task } from '../types';

interface BubbleProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (task: Task) => void;
  onDrop: (id: string, zone: 'hoy' | 'luego') => void;
}

export const TaskBubble: React.FC<BubbleProps> = ({ task, onComplete, onDelete, onFocus, onDrop }) => {
  const controls = useAnimation();
  const bubbleRef = useRef<HTMLDivElement>(null);
  // FIX: usar ref en lugar de state para isDragging, evita re-renders que desmontaban la burbuja
  const isDraggingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [timeUntilDue, setTimeUntilDue] = useState<string | null>(null);
  const DRAG_DROP_THRESHOLD = 35;

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

  // Size based on priority
  const size = task.priority === 3 ? 160 : task.priority === 2 ? 130 : 100;

  // Color based on urgency
  const isUrgent = task.priority === 3;
  const color = isUrgent ? 'bg-red-500/20 border-red-500/50' : 'bg-blue-500/20 border-blue-500/50';

  // Deterministic random position based on task ID
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const hash = getHash(task.id);
  const leftOffset = (hash % 400) - 200;
  const topOffset = ((hash >> 8) % 300) - 150;

  // FIX: usar variantes nombradas para que Framer Motion no confunda
  // el estado inicial con re-renders posteriores
  const bubbleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
    gone: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2, ease: 'backIn' },
    },
  };

  // FIX: al montar o cuando cambia el task, arrancar animación "visible"
  // con variante nombrada evita el problema de initial={scale:0} en re-renders
  useEffect(() => {
    controls.start('visible');
  }, [task.id, task.status, controls]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event: any, info: any) => {
    // FIX: sin setTimeout — resolvía race condition que ocultaba la burbuja
    isDraggingRef.current = false;

    const dragDistance = Math.hypot(info.offset.x, info.offset.y);
    const y = info.point.y;

    if (dragDistance > DRAG_DROP_THRESHOLD && y < 200) {
      const x = info.point.x;
      const mid = window.innerWidth / 2;

      // Animación de succión al soltar en zona
      controls.start('gone');

      if (x < mid) {
        onDrop(task.id, 'hoy');
      } else {
        onDrop(task.id, 'luego');
      }
    } else {
      // FIX: reset con variante nombrada, no objeto inline
      controls.start('visible');
    }
  };

  const handleTap = (event: any) => {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('[data-no-focus="true"]')) {
      return;
    }
    // FIX: leer ref, no state — sin re-render en medio del tap
    if (!isDraggingRef.current) {
      onFocus(task);
    }
  };

  const formattedTime = task.due_date
    ? new Date(task.due_date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <motion.div
      ref={bubbleRef}
      drag
      dragElastic={0.1}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      // FIX: variants + initial="hidden" + animate={controls}
      // Framer Motion sabe que "hidden" es solo el estado de montaje,
      // y no lo vuelve a aplicar en re-renders posteriores
      variants={bubbleVariants}
      initial="hidden"
      animate={controls}
      className={`absolute cursor-grab active:cursor-grabbing rounded-full flex items-center justify-center text-center p-4 border-2 backdrop-blur-md transition-shadow hover:shadow-lg group ${color}`}
      style={{
        width: size,
        height: size,
        left: `calc(50% + ${leftOffset}px)`,
        top: `calc(50% + ${topOffset}px + 200px)`,
        // FIX: usar isDraggingRef.current no funciona para zIndex en render,
        // pero podemos usar un state liviano solo para z-index visual
        zIndex: 1,
      }}
    >
      <div className="flex flex-col items-center gap-1 pointer-events-none">
        <span className="text-xs font-medium leading-tight overflow-hidden text-ellipsis line-clamp-2">
          {task.title}
        </span>

        {formattedTime && (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-[9px] text-white/60 font-mono">
              <Calendar className="w-2 h-2" />
              {formattedTime}
            </div>
            {timeUntilDue && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-1 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                  timeUntilDue === 'Vencido'
                    ? 'bg-red-500 text-white'
                    : 'bg-flow-accent/20 text-flow-accent'
                }`}
              >
                <Clock className="w-2 h-2" />
                {timeUntilDue === 'Vencido' ? 'Vencido' : `Faltan ${timeUntilDue}`}
              </motion.div>
            )}
          </div>
        )}

        {isUrgent && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] mt-1"
          />
        )}
      </div>

      {/* Delete Button */}
      <button
        data-no-focus="true"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className={`absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white transition-all duration-150 hover:bg-red-600 ${
          isHovered
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
};