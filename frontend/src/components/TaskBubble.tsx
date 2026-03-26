import React, { useRef, useState, useEffect } from "react";
import { motion, useAnimation } from "motion/react";
import { Trash2, Clock } from "lucide-react";
import { Task } from "../types";

// DESPUÉS
interface BubbleProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onFocus: (task: Task) => void;
  onDrop: (id: string, zone: "hoy" | "luego") => void;
  dropZoneHoyRef?: React.RefObject<HTMLDivElement>;
  dropZoneLuegoRef?: React.RefObject<HTMLDivElement>;
}

export const TaskBubble: React.FC<BubbleProps> = ({
  task,
  onComplete,
  onDelete,
  onFocus,
  onDrop,
  dropZoneHoyRef,
  dropZoneLuegoRef,
}) => {
  const controls = useAnimation();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const DRAG_DROP_THRESHOLD = 35;

  const getDueLabel = (): { text: string; overdue: boolean } | null => {
    if (!task.dueDate) return null;
    const now = new Date();
    const due = new Date(
      task.dueDate.endsWith("Z") ? task.dueDate.slice(0, -1) : task.dueDate,
    );
    const isOverdue = due.getTime() < now.getTime();
    const time = due.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round(
      (dueDay.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (isOverdue) return { text: `Vencido · ${time}`, overdue: true };
    if (diffDays === 0) return { text: `Hoy · ${time}`, overdue: false };
    if (diffDays === 1) return { text: `Mañana · ${time}`, overdue: false };
    if (diffDays < 7) {
      const dayName = due.toLocaleDateString("es-ES", { weekday: "short" });
      return { text: `${dayName} · ${time}`, overdue: false };
    }
    const dateStr = due.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    return { text: `${dateStr} · ${time}`, overdue: false };
  };

  const dueLabel = getDueLabel();

  // Size based on priority
  const size = task.priority === 3 ? 160 : task.priority === 2 ? 130 : 100;

  // Color based on urgency
  const isUrgent = task.priority === 3;
  const palette = isUrgent
    ? {
        border: "rgba(239, 68, 68, 0.48)",
        bg: "rgba(14, 14, 14, 0.68)",
        glow: "0 6px 18px rgba(239,68,68,0.18)",
        badge: "text-red-300",
      }
    : {
        border: "rgba(148, 163, 184, 0.44)",
        bg: "rgba(14, 14, 14, 0.66)",
        glow: "0 6px 18px rgba(15,23,42,0.22)",
        badge: "text-slate-300",
      };

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
  const floatDuration = 8 + (Math.abs(hash) % 5);
  const floatX = ((hash >> 4) % 16) - 8;
  const floatY = ((hash >> 10) % 20) - 10;
  const floatRotate = ((hash >> 14) % 6) - 3;

  // Reset animation when task status changes or component mounts
  useEffect(() => {
    controls.start({
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    });
  }, [task.id, task.status, controls]); // Added task.id

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = (event: any, info: any) => {
    setTimeout(() => setIsDragging(false), 50);

    const dragDistance = Math.hypot(info.offset.x, info.offset.y);

    const pointerX =
      info.point?.x ??
      event?.clientX ??
      event?.changedTouches?.[0]?.clientX ??
      0;

    const pointerY =
      info.point?.y ??
      event?.clientY ??
      event?.changedTouches?.[0]?.clientY ??
      (bubbleRef.current
        ? bubbleRef.current.getBoundingClientRect().top + info.offset.y
        : Infinity);

    // Movimiento muy pequeño = tap, no drop
    if (dragDistance < 20) {
      controls.start({
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      });
      return;
    }

    // Detecta colisión contra las coordenadas reales de cada zona
    const isOverZone = (ref?: React.RefObject<HTMLDivElement>) => {
      if (!ref?.current) return false;
      const rect = ref.current.getBoundingClientRect();
      const margin = 64;

      // Check 1: posición del puntero al soltar
      const pointerMatch =
        pointerX >= rect.left - margin &&
        pointerX <= rect.right + margin &&
        pointerY >= rect.top - margin &&
        pointerY <= rect.bottom + margin;

      // Check 2: centro real de la burbuja con offset del drag
      const bubbleMatch = bubbleRef.current
        ? (() => {
            const original = bubbleRef.current!.getBoundingClientRect();
            const realCenterX =
              original.left + original.width / 2 + info.offset.x;
            const realCenterY =
              original.top + original.height / 2 + info.offset.y;
            return (
              realCenterX >= rect.left - margin &&
              realCenterX <= rect.right + margin &&
              realCenterY >= rect.top - margin &&
              realCenterY <= rect.bottom + margin
            );
          })()
        : false;

      // Check 3: posición visual estimada usando point - mitad del tamaño
      const halfSize =
        (bubbleRef.current?.getBoundingClientRect().width ?? 100) / 2;
      const visualMatch =
        pointerX >= rect.left - halfSize &&
        pointerX <= rect.right + halfSize &&
        pointerY >= rect.top - halfSize &&
        pointerY <= rect.bottom + halfSize;

      return pointerMatch || bubbleMatch || visualMatch;
    };

    if (isOverZone(dropZoneHoyRef)) {
      controls.start({
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2, ease: "backIn" },
      });
      onDrop(task.id, "hoy");
    } else if (isOverZone(dropZoneLuegoRef)) {
      controls.start({
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2, ease: "backIn" },
      });
      onDrop(task.id, "luego");
    } else {
      // No cayó en ninguna zona — rebota
      controls.start({
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      });
    }
  };

  const handleTap = (event: any) => {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('[data-no-focus="true"]')) {
      return;
    }

    if (!isDragging) {
      onFocus(task);
    }
  };

  return (
    <motion.div
      ref={bubbleRef}
      drag
      dragElastic={0.1}
      dragMomentum={false}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      animate={controls}
      className="absolute cursor-grab active:cursor-grabbing group select-none"
      style={{
        width: size,
        height: size,
        left: `calc(50% + ${leftOffset}px)`,
        top: `calc(50% + ${topOffset}px + 200px)`,
        zIndex: isDragging ? 100 : 1,
      }}
      initial={{ scale: 0, opacity: 0 }}
    >
      <motion.div
        animate={
          isDragging
            ? { x: 0, y: 0, rotate: 0, scale: 1 }
            : {
                x: [0, floatX, 0, -floatX * 0.6, 0],
                y: [0, floatY, 0, -floatY * 0.5, 0],
                rotate: [0, floatRotate, 0, -floatRotate * 0.7, 0],
                scale: [1, 1.015, 1, 0.995, 1],
              }
        }
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full rounded-full flex items-center justify-center text-center p-4 border transition-transform duration-300 ease-out hover:scale-105 active:scale-95"
        style={{
          backgroundColor: palette.bg,
          borderColor: palette.border,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: `${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), rgba(255,255,255,0) 56%)",
          }}
        />

        <div className="flex flex-col items-center gap-1 pointer-events-none">
          <span className="text-xs font-medium text-white/90 leading-tight overflow-hidden text-ellipsis line-clamp-2">
            {task.title}
          </span>

          {dueLabel && (
            <div
              className={`flex items-center gap-1 text-[9px] font-mono mt-0.5 ${
                dueLabel.overdue ? "text-red-300" : "text-white/45"
              }`}
            >
              <Clock className="w-2 h-2 shrink-0" />
              <span>{dueLabel.text}</span>
            </div>
          )}

          {isUrgent && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1 h-1 rounded-full bg-red-400/85 mt-1"
            />
          )}
        </div>
      </motion.div>

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
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/10 text-white/80 border border-white/15 transition-all duration-150 hover:bg-red-500/80 hover:text-white hover:border-red-300/40 ${
          isHovered
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
};
