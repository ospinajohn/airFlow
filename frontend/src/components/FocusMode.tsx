import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, X, Play, Pause, RotateCcw, Timer, Edit2, Save,
  Folder, AlignLeft, Loader2, ChevronLeft, ChevronRight,
  ChevronDown, Calendar,
} from 'lucide-react';
import { Task, Project } from '../types';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isSameDay, isToday, parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface FocusModeProps {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void;
  autoStart: boolean;
}

// ─── Custom Date Picker ───────────────────────────────────────────────────────

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? startOfMonth(parseISO(value)) : startOfMonth(new Date()),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  });

  const selected = value ? parseISO(value) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 text-xs text-white/60 hover:text-white/80 transition-all"
      >
        <Calendar className="w-3.5 h-3.5 text-white/30" />
        <span className="font-mono">
          {selected ? format(selected, 'd MMM yyyy', { locale: es }) : 'Sin fecha'}
        </span>
        <ChevronDown className="w-3 h-3 text-white/20" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-72 glass rounded-2xl border border-white/10 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono text-white/70 capitalize">
                {format(viewMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
                <div key={d} className="text-center text-[10px] font-mono text-white/25 uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day) => {
                const isSelected = selected ? isSameDay(day, selected) : false;
                const isCurrent = isToday(day);
                const isOtherMonth = !isSameMonth(day, viewMonth);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(format(day, 'yyyy-MM-dd'));
                      setOpen(false);
                    }}
                    className={`
                      aspect-square rounded-lg text-[12px] font-mono transition-all
                      ${isSelected
                        ? 'bg-flow-accent text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        : isCurrent
                          ? 'border border-flow-accent/40 text-flow-accent'
                          : isOtherMonth
                            ? 'text-white/15 hover:bg-white/5'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); setOpen(false); }}
                className="text-[11px] font-mono text-flow-accent hover:text-white transition-colors"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Custom Project Selector ──────────────────────────────────────────────────

function ProjectSelector({
  value,
  projects,
  onChange,
}: {
  value: string | undefined;
  projects: Project[];
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = projects.find((p) => p.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 text-xs text-white/60 hover:text-white/80 transition-all"
      >
        <Folder className="w-3.5 h-3.5 text-white/30" />
        <span className="font-mono">
          {selected ? selected.name : 'Sin Proyecto'}
        </span>
        {selected && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: selected.color || '#3b82f6' }}
          />
        )}
        <ChevronDown className="w-3 h-3 text-white/20" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-52 glass rounded-2xl border border-white/10 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sin proyecto option */}
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all ${!value
                  ? 'bg-white/10 text-white/80'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                }`}
            >
              <div className="w-2 h-2 rounded-full bg-white/20" />
              Sin Proyecto
            </button>

            {projects.length > 0 && (
              <div className="my-1.5 h-px bg-white/[0.06]" />
            )}

            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all ${value === p.id
                    ? 'bg-white/10 text-white/80'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color || '#3b82f6' }}
                />
                <span className="truncate">{p.name}</span>
                {value === p.id && (
                  <Check className="w-3 h-3 ml-auto text-flow-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FocusMode ────────────────────────────────────────────────────────────────

export const FocusMode: React.FC<FocusModeProps> = ({
  task, projects, onClose, onComplete, onUpdate, autoStart,
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(autoStart);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedPriority, setEditedPriority] = useState(1);
  const [editedDate, setEditedDate] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedProjectId, setEditedProjectId] = useState<string | undefined>(undefined);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (task && task.id !== lastTaskId) {
      setTimeLeft(25 * 60);
      setIsActive(autoStart);
      setLastTaskId(task.id);
      setEditedTitle(task.title);
      setEditedPriority(task.priority || 1);
      setEditedDate(task.due_date ? task.due_date.split('T')[0] : '');
      setEditedDescription(task.description || '');
      setEditedProjectId(task.project_id);
      setIsEditing(false);
    }
  }, [task?.id, lastTaskId, task]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: editedTitle,
        priority: editedPriority,
        due_date: editedDate || undefined,
        description: editedDescription,
        project_id: editedProjectId,
      });
      await new Promise((r) => setTimeout(r, 600));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  const progress = (timeLeft / (25 * 60)) * 100;
  const taskProject = projects.find((p) => p.id === task.project_id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 transition-colors z-[110]"
        >
          <X className="w-8 h-8 text-white/40" />
        </button>

        {/* Ambient bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full focus-ambient-pulse"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}
          />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full focus-ambient-pulse"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', animationDelay: '2s' }}
          />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-4xl w-full flex flex-col items-center gap-12"
        >
          {/* Header */}
          <div className="text-center space-y-4 w-full px-4">
            <div className="flex items-center justify-center gap-2 text-flow-accent font-mono text-sm tracking-widest uppercase">
              <Timer className="w-4 h-4" />
              <span>Enfoque Pomodoro</span>
            </div>

            {isEditing ? (
              <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto w-full">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-3xl md:text-5xl font-display text-center outline-none focus:border-flow-accent transition-colors"
                  autoFocus
                />

                <div className="w-full space-y-3">
                  {/* Description */}
                  <div className="flex items-start gap-3 bg-white/5 border border-white/[0.06] p-4 rounded-xl">
                    <AlignLeft className="w-4 h-4 text-white/20 mt-0.5 flex-shrink-0" />
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Añadir detalles de la tarea..."
                      className="w-full bg-transparent border-none outline-none text-sm text-white/60 placeholder:text-white/20 min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Controls row */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {/* Custom project selector */}
                    <ProjectSelector
                      value={editedProjectId}
                      projects={projects}
                      onChange={setEditedProjectId}
                    />

                    {/* Priority */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/[0.06] rounded-xl p-1">
                      {[1, 2, 3].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditedPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-widest transition-all ${editedPriority === p
                              ? 'bg-flow-accent text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                              : 'text-white/35 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                          P{p}
                        </button>
                      ))}
                    </div>

                    {/* Custom date picker */}
                    <DatePicker value={editedDate} onChange={setEditedDate} />
                  </div>
                </div>

                {/* Save / Cancel */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isSaving
                        ? 'bg-emerald-500/40 cursor-not-allowed text-white/50'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 text-sm transition-all disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative inline-block text-center space-y-4">
                <motion.h1
                  animate={{ opacity: [0.85, 1, 0.85], letterSpacing: ['0em', '0.01em', '0em'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-5xl md:text-7xl font-display font-semibold tracking-tight leading-tight max-w-2xl mx-auto"
                >
                  {task.title}
                </motion.h1>

                {task.description && (
                  <p className="text-white/40 text-lg max-w-xl mx-auto font-light">{task.description}</p>
                )}

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {taskProject && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono text-white/50"
                      style={{
                        borderColor: `${taskProject.color || '#3b82f6'}30`,
                        backgroundColor: `${taskProject.color || '#3b82f6'}10`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: taskProject.color || '#3b82f6' }}
                      />
                      {taskProject.name}
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-[11px] font-mono text-white/35">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(task.due_date.split('T')[0]), 'd MMM', { locale: es })}
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-full bg-white/5 text-white/20 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:bg-white/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <motion.circle
                cx="50%" cy="50%" r="48%" fill="none"
                stroke="var(--color-flow-accent)" strokeWidth="4"
                strokeDasharray="100 100"
                animate={{ strokeDashoffset: 100 - progress }}
                transition={{ duration: 1, ease: 'linear' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center gap-2 relative z-20">
              <span className="text-6xl md:text-8xl font-mono font-light tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90 z-30"
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsActive(false); setTimeLeft(25 * 60); }}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90 z-30"
                >
                  <RotateCcw className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-6 relative z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); onClose(); }}
              className="px-12 py-4 rounded-full bg-flow-accent font-semibold text-lg shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all flex items-center gap-3 z-30"
            >
              <Check className="w-6 h-6" />
              <span>Completar Tarea</span>
            </motion.button>
            <p className="text-white/30 font-light italic text-sm">
              "El secreto para salir adelante es comenzar."
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};