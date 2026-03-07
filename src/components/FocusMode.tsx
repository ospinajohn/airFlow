import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Play, Pause, RotateCcw, Timer, Edit2, Save, Folder, AlignLeft, Loader2 } from 'lucide-react';
import { Task, Project } from '../types';

interface FocusModeProps {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void;
  autoStart: boolean;
}

export const FocusMode: React.FC<FocusModeProps> = ({ task, projects, onClose, onComplete, onUpdate, autoStart }) => {
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

  // Reset timer and edit state only when the task ID actually changes
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
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task) {
      setIsSaving(true);
      try {
        await onUpdate(task.id, {
          title: editedTitle,
          priority: editedPriority,
          due_date: editedDate ? new Date(editedDate).toISOString() : undefined,
          description: editedDescription,
          project_id: editedProjectId,
        });
        // Tiny delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsEditing(false);
      } catch (error) {
        console.error("Error saving task:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!task) return null;

  const progress = (timeLeft / (25 * 60)) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 transition-colors z-[110]"
        >
          <X className="w-8 h-8 text-white/40" />
        </button>

        {/* Ambient pulse background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full focus-ambient-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            }}
          />
          <div 
            className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full focus-ambient-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
              animationDelay: '2s',
            }}
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
                
                <div className="w-full space-y-4">
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl">
                    <AlignLeft className="w-5 h-5 text-white/20 mt-1" />
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Añadir detalles de la tarea..."
                      className="w-full bg-transparent border-none outline-none text-sm text-white/60 min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                      <Folder className="w-4 h-4 text-white/20" />
                      <select
                        value={editedProjectId || ''}
                        onChange={(e) => setEditedProjectId(e.target.value || undefined)}
                        className="bg-transparent border-none outline-none text-xs text-white/60 cursor-pointer"
                      >
                        <option value="" className="bg-neutral-900">Sin Proyecto</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id} className="bg-neutral-900">{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((p) => (
                        <button
                          key={p}
                          onClick={() => setEditedPriority(p)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                            editedPriority === p 
                              ? 'bg-flow-accent text-white' 
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          P{p}
                        </button>
                      ))}
                    </div>

                    <input
                      type="date"
                      value={editedDate}
                      onChange={(e) => setEditedDate(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 outline-none focus:border-flow-accent transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`p-3 rounded-full transition-all active:scale-90 flex items-center justify-center min-w-[48px] ${
                      isSaving ? 'bg-emerald-500/50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Save className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="p-3 rounded-full bg-white/5 text-white/40 hover:bg-white/10 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative inline-block text-center space-y-4">
                <motion.h1
                  animate={{ 
                    opacity: [0.85, 1, 0.85],
                    letterSpacing: ['0em', '0.01em', '0em'],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-5xl md:text-7xl font-display font-semibold tracking-tight leading-tight max-w-2xl mx-auto"
                >
                  {task.title}
                </motion.h1>
                
                {task.description && (
                  <p className="text-white/40 text-lg max-w-xl mx-auto font-light">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-center gap-4">
                  {task.project_id && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/40 uppercase tracking-widest">
                      <Folder className="w-3 h-3" />
                      {projects.find(p => p.id === task.project_id)?.name}
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-full bg-white/5 text-white/20 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:bg-white/10"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timer Circle */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="4"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="var(--color-flow-accent)"
                strokeWidth="4"
                strokeDasharray="100 100"
                animate={{ strokeDashoffset: 100 - progress }}
                transition={{ duration: 1, ease: "linear" }}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="flex flex-col items-center gap-2 relative z-20">
              <span className="text-6xl md:text-8xl font-mono font-light tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleTimer}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90 z-30"
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                <button 
                  onClick={resetTimer}
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
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
                onClose();
              }}
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
