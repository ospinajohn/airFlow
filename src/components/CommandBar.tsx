import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, X, Send } from 'lucide-react';
import { parseTaskInputLocally } from '../services/nlpService';
import { Task, NLPResult } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommandBarProps {
  onTaskCreated: (task: Partial<Task>) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onTaskCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<NLPResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      setPreview(parseTaskInputLocally(input));
    } else {
      setPreview(null);
    }
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsParsing(true);
    // Local parsing is synchronous and free!
    const parsed = parseTaskInputLocally(input);
    
    onTaskCreated({
      id: crypto.randomUUID(),
      title: parsed.title,
      due_date: parsed.due_date,
      priority: parsed.priority || 1,
      status: 'backlog',
      created_at: new Date().toISOString(),
    });

    setInput('');
    setIsParsing(false);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl glass rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-center gap-3">
                <Command className="w-5 h-5 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="¿Qué tienes en mente? (ej. Llamar a mamá mañana a las 5pm)"
                  className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-white/20"
                  disabled={isParsing}
                />
                {isParsing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-flow-accent border-t-transparent rounded-full"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-white/20 font-mono">
                    <span className="px-1.5 py-0.5 rounded border border-white/10">ENTER</span>
                  </div>
                )}
              </div>

              {preview && preview.due_date && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-white/40"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-flow-accent animate-pulse" />
                  <span>Se programará para: </span>
                  <span className="text-white/60 font-medium">
                    {format(new Date(preview.due_date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  </span>
                  {preview.priority === 3 && (
                    <span className="ml-auto px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                      Alta Prioridad
                    </span>
                  )}
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
