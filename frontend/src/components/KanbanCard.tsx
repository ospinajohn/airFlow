import React, { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Trash2,
  Flag,
  Play,
  TimerReset,
  Sunrise,
  CalendarDays,
} from "lucide-react";
import { Task, Project } from "../types";

const STATUS_COLORS: Record<string, string> = {
  backlog: "#6B7280",
  todo: "#3B82F6",
  doing: "#F59E0B",
  done: "#10B981",
};

const STATUS_GLOW: Record<string, string> = {
  backlog: "rgba(107,114,128,0.15)",
  todo: "rgba(59,130,246,0.15)",
  doing: "rgba(245,158,11,0.15)",
  done: "rgba(16,185,129,0.15)",
};

const PRIORITY_CONFIG: Record<
  number,
  { label: string; color: string; bg: string; glow: string }
> = {
  1: { label: "Baja", color: "text-white/30", bg: "bg-white/5", glow: "" },
  2: {
    label: "Media",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    glow: "0 0 8px rgba(245,158,11,0.3)",
  },
  3: {
    label: "Alta",
    color: "text-red-400",
    bg: "bg-red-500/10",
    glow: "0 0 10px rgba(239,68,68,0.4)",
  },
};

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete?: (id: string) => void;
  projects?: Project[];
  selected?: boolean;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
  onSnooze?: (
    id: string,
    preset: "laterToday" | "tomorrow" | "nextMonday",
  ) => void;
  snoozeCount?: number;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onClick,
  onDelete,
  projects = [],
  selected = false,
  onToggleSelect,
  onSnooze,
  snoozeCount = 0,
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
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[1];
  const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.backlog;
  const statusGlow = STATUS_GLOW[task.status] || STATUS_GLOW.backlog;

  useEffect(() => {
    if (!task.dueDate) {
      setTimeUntilDue(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const due = new Date(task.dueDate!).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setTimeUntilDue("Vencido");
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
  }, [task.dueDate]);

  const isOverdue = timeUntilDue === "Vencido";
  const isAvoiding = snoozeCount >= 3;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={
        isHovered
          ? {
              y: -2,
              boxShadow: `0 8px 32px ${statusGlow}, 0 2px 8px rgba(0,0,0,0.4)`,
            }
          : {
              y: 0,
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative rounded-xl bg-flow-card/80 border cursor-grab active:cursor-grabbing touch-none backdrop-blur-sm overflow-hidden ${
        selected
          ? "border-flow-accent/70"
          : isHovered
            ? "border-white/[0.18]"
            : "border-white/[0.06]"
      }`}
    >
      {/* Shimmer de luz interior en hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Glow sutil en la parte superior basado en el status */}
      <motion.div
        animate={
          isHovered ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.6 }
        }
        transition={{ duration: 0.25 }}
        className="absolute top-0 left-4 right-4 h-[1px] pointer-events-none z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${statusColor}60, transparent)`,
        }}
      />

      {/* Left accent border — se expande en hover */}
      <motion.div
        animate={
          isHovered
            ? { top: "6px", bottom: "6px", opacity: 1 }
            : { top: "14px", bottom: "14px", opacity: 0.6 }
        }
        transition={{ duration: 0.2 }}
        className="absolute left-0 w-[3px] rounded-full"
        style={{ backgroundColor: statusColor }}
      />

      <div className="relative z-10 p-3.5 pl-4">
        {/* Header row: checkbox + proyecto + priority dot + acciones */}
        <div className="flex items-center justify-between mb-2 min-h-[20px]">
          {/* Izquierda: checkbox inline + badge de proyecto */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {onToggleSelect && (
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(task.id, e.shiftKey);
                }}
                className={`w-4 h-4 rounded border transition-all flex-shrink-0 flex items-center justify-center ${
                  selected
                    ? "bg-flow-accent border-flow-accent shadow-[0_0_12px_rgba(59,130,246,0.35)]"
                    : "bg-black/20 border-white/20 opacity-0 group-hover:opacity-100"
                }`}
                title={selected ? "Deseleccionar" : "Seleccionar"}
              >
                {selected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            )}

            {project && (
              <>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: project.color || "#3b82f6",
                    boxShadow: isHovered
                      ? `0 0 6px ${project.color || "#3b82f6"}90`
                      : "none",
                  }}
                />
                <span className="text-[10px] font-medium text-white/35 truncate group-hover:text-white/50 transition-colors duration-200">
                  {project.name}
                </span>
              </>
            )}
          </div>

          {/* Derecha: priority dot → acciones en hover */}
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
            {task.priority === 3 && (
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 4px rgba(239,68,68,0.4)",
                    "0 0 12px rgba(239,68,68,0.7)",
                    "0 0 4px rgba(239,68,68,0.4)",
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 group-hover:hidden"
              />
            )}
            {task.priority === 2 && (
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 3px rgba(245,158,11,0.3)",
                    "0 0 8px rgba(245,158,11,0.6)",
                    "0 0 3px rgba(245,158,11,0.3)",
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
                className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 group-hover:hidden"
              />
            )}

            {/* Acciones con entrada escalonada */}
            <div className="hidden group-hover:flex items-center gap-0.5">
              {onSnooze && (
                <div className="relative">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0, duration: 0.15 }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSnoozeMenu((prev) => !prev);
                    }}
                    className="p-1.5 rounded-lg hover:bg-amber-500/20 text-white/30 hover:text-amber-300 transition-colors"
                    title="Posponer"
                  >
                    <TimerReset className="w-3.5 h-3.5" />
                  </motion.button>

                  {showSnoozeMenu && (
                    <div
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="absolute top-8 right-0 z-20 w-40 glass rounded-xl p-1.5 space-y-1"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSnooze(task.id, "laterToday");
                          setShowSnoozeMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Clock className="w-3 h-3" />
                        Esta tarde
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSnooze(task.id, "tomorrow");
                          setShowSnoozeMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Sunrise className="w-3 h-3" />
                        Mañana
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSnooze(task.id, "nextMonday");
                          setShowSnoozeMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <CalendarDays className="w-3 h-3" />
                        Lunes
                      </button>
                    </div>
                  )}
                </div>
              )}

              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(task);
                }}
                className="p-1.5 rounded-lg hover:bg-flow-accent/20 text-white/30 hover:text-flow-accent transition-colors"
                title="Iniciar focus"
              >
                <Play className="w-3.5 h-3.5" />
              </motion.button>

              {onDelete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Título con micro-lift */}
        <motion.div
          animate={isHovered ? { y: -1 } : { y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(task);
          }}
          className="cursor-pointer"
        >
          <h4
            className="text-[13px] font-medium leading-snug transition-colors duration-200"
            style={{
              color: isHovered
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.88)",
            }}
          >
            {task.title}
          </h4>
        </motion.div>

        {/* Properties row */}
        <motion.div
          animate={isHovered ? { y: -1 } : { y: 0 }}
          transition={{ duration: 0.2, delay: 0.03 }}
          className="flex items-center gap-2 mt-2.5 flex-wrap"
        >
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                isOverdue
                  ? "bg-red-500/15 text-red-400"
                  : isHovered
                    ? "bg-white/[0.07] text-white/50"
                    : "bg-white/[0.04] text-white/35"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}

          {timeUntilDue && (
            <div
              className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition-all duration-200 ${
                isOverdue
                  ? "bg-red-500/15 text-red-400"
                  : "bg-flow-accent/10 text-flow-accent/70"
              }`}
              style={
                !isOverdue && isHovered
                  ? {
                      backgroundColor: "rgba(59,130,246,0.18)",
                      color: "rgba(59,130,246,0.9)",
                    }
                  : {}
              }
            >
              <Clock className="w-3 h-3" />
              <span>{timeUntilDue}</span>
            </div>
          )}

          {task.priority >= 2 && (
            <div
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-all duration-200 ${priority.bg} ${priority.color}`}
            >
              <Flag className="w-3 h-3" />
              <span className="font-medium">{priority.label}</span>
            </div>
          )}

          {snoozeCount > 0 && (
            <div
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                isAvoiding
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-white/[0.04] text-white/45"
              }`}
            >
              <TimerReset className="w-3 h-3" />
              <span>
                {snoozeCount} pospuesta{snoozeCount > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {isAvoiding && (
            <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-300">
              <span className="font-semibold">Evasión detectada</span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
