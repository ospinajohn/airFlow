import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Command } from "lucide-react";
import { parseTaskInputLocally } from "../services/nlpService";
import { Task, NLPResult, Project, TaskStatus } from "../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CommandBarProps {
  onTaskCreated: (task: Partial<Task>) => void;
  projects?: Project[];
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onTaskCreated,
  projects = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<NLPResult | null>(null);
  const [quickStatus, setQuickStatus] = useState<TaskStatus>("backlog");
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
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.code === "Space" || e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    const lowerInput = input.toLowerCase();
    const matchedProject = projects.find((p) =>
      lowerInput.includes(p.name.toLowerCase()),
    );
    const inferredStatus = lowerInput.includes("hoy") ? "todo" : quickStatus;

    onTaskCreated({
      title: parsed.title,
      dueDate: parsed.dueDate,
      priority: parsed.priority || 1,
      status: inferredStatus,
      projectId: matchedProject?.id,
    });

    setInput("");
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
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-flow-accent border-t-transparent rounded-full"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-white/20 font-mono">
                    <span className="px-1.5 py-0.5 rounded border border-white/10">
                      ENTER
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickStatus("todo")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                    quickStatus === "todo"
                      ? "bg-flow-accent text-white"
                      : "bg-white/5 text-white/40 hover:text-white/70"
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setQuickStatus("backlog")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                    quickStatus === "backlog"
                      ? "bg-flow-accent text-white"
                      : "bg-white/5 text-white/40 hover:text-white/70"
                  }`}
                >
                  Luego
                </button>
                <span className="ml-auto text-[10px] text-white/25 font-mono">
                  Ctrl/Cmd + K
                </span>
              </div>

              {preview && preview.dueDate && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-white/40"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-flow-accent animate-pulse" />
                  <span>Se programará para: </span>
                  <span className="text-white/60 font-medium lowercase">
                    {format(new Date(preview.dueDate), "EEEE d 'de' MMMM", {
                      locale: es,
                    })}
                    {input.match(/\d+/) && (
                      <span className="ml-1 text-flow-accent">
                        a las {format(new Date(preview.dueDate), "HH:mm")}
                      </span>
                    )}
                  </span>
                  {preview.priority === 3 && (
                    <span className="ml-auto px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                      Alta Prioridad
                    </span>
                  )}
                </motion.div>
              )}

              {!preview?.dueDate && input.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-white/40"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-flow-accent/70" />
                  <span>Destino:</span>
                  <span className="text-white/70 font-medium">
                    {quickStatus === "todo" ? "Hoy" : "Luego"}
                  </span>
                  <span className="ml-3">
                    Tip: escribe el nombre del proyecto para asignarlo
                    automáticamente.
                  </span>
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
