import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, List, Calendar, Settings, Zap, Plus, X, AlertTriangle, Trash2, Clock, BarChart3 } from 'lucide-react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CommandBar } from './components/CommandBar';
import { TaskBubble } from './components/TaskBubble';
import { FocusMode } from './components/FocusMode';
import { KanbanCard } from './components/KanbanCard';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { Task, Project, TaskStatus } from './types';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'bubbles' | 'kanban' | 'projects' | 'analytics'>('bubbles');
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoStartPomodoro, setAutoStartPomodoro] = useState(false); // Por defecto desactivado
  const [showSettings, setShowSettings] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false); 
  const [projectsViewMode, setProjectsViewMode] = useState<'grid' | 'calendar'>('grid');
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1); // 0 = Domingo, 1 = Lunes

  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskCreated = async (taskData: Partial<Task>) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskStatusChange = async (id: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
      fetchTasks(); // Rollback on error
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleTaskComplete = async (id: string) => {
    handleTaskStatusChange(id, 'done');
  };

  const handleTaskDelete = async (id: string) => {
    const targetTask = tasks.find((task) => task.id === id);
    setTaskToDelete({
      id,
      title: targetTask?.title || 'esta tarea',
    });
  };

  const confirmTaskDelete = async () => {
    if (!taskToDelete) return;

    setIsDeletingTask(true);
    try {
      await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });
      fetchTasks();
      if (focusedTask?.id === taskToDelete.id) {
        setFocusedTask(null);
      }
      setTaskToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleTaskDrop = async (id: string, zone: 'hoy' | 'luego') => {
    const newStatus = zone === 'hoy' ? 'todo' : 'backlog';
    handleTaskStatusChange(id, newStatus);
  };

  const findColumnId = (id: string): TaskStatus | undefined => {
    if (['backlog', 'todo', 'doing', 'done'].includes(id)) return id as TaskStatus;
    return tasks.find(t => t.id === id)?.status;
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    const columnId = findColumnId(event.active.id);
    setOverColumnId(columnId || null);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    const overStatus = findColumnId(over.id as string);

    setOverColumnId(overStatus || null);

    if (activeTask && overStatus && activeTask.status !== overStatus) {
      setTasks((prev) => prev.map(t =>
        t.id === active.id ? { ...t, status: overStatus } : t
      ));
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    handleTaskStatusChange(activeTask.id, activeTask.status);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverColumnId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-flow-bg">
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* Navigation Rail */}
      <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-6 p-2 glass rounded-full">
        <NavButton active={view === 'bubbles'} onClick={() => setView('bubbles')} icon={<Zap />} label="Flujo" />
        <NavButton active={view === 'kanban'} onClick={() => setView('kanban')} icon={<LayoutGrid />} label="Tablero" />
        <NavButton active={view === 'projects'} onClick={() => setView('projects')} icon={<List />} label="Proyectos" />
        <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} icon={<BarChart3 />} label="Estadísticas" />
        <div className="w-8 h-px bg-white/10 mx-auto my-2" />
        <NavButton active={showSettings} onClick={() => setShowSettings(true)} icon={<Settings />} label="Ajustes" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {view === 'bubbles' && (
            <motion.div
              key="bubbles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full relative overflow-hidden"
            >
              {/* Drop Zones */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-8">
                <DropZone label="Hoy" color="bg-emerald-500/10" />
                <DropZone label="Luego" color="bg-amber-500/10" />
              </div>

              {tasks.filter(t => t.status !== 'done').map((task) => (
                <TaskBubble 
                  key={task.id} 
                  task={task} 
                  onFocus={setFocusedTask}
                  onComplete={handleTaskComplete}
                  onDelete={handleTaskDelete}
                  onDrop={handleTaskDrop}
                />
              ))}

              {tasks.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-white/20">
                  <p className="text-xl font-display">Presiona Ctrl + Espacio para empezar</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'kanban' && (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <motion.div
                key="kanban"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="h-full p-8 pl-24 overflow-x-auto flex gap-6 no-scrollbar"
              >
                <KanbanColumn 
                  id="backlog"
                  title="Pendientes" 
                  subtitle="Luego"
                  color="#6B7280"
                  tasks={tasks.filter(t => t.status === 'backlog')} 
                  onTaskClick={setFocusedTask}
                  onDelete={handleTaskDelete}
                  projects={projects}
                  isOver={overColumnId === 'backlog'}
                  isDragging={!!activeId}
                />
                <KanbanColumn 
                  id="todo"
                  title="Por Hacer" 
                  subtitle="Hoy"
                  color="#3B82F6"
                  tasks={tasks.filter(t => t.status === 'todo')} 
                  onTaskClick={setFocusedTask}
                  onDelete={handleTaskDelete}
                  projects={projects}
                  isOver={overColumnId === 'todo'}
                  isDragging={!!activeId}
                />
                <KanbanColumn 
                  id="doing"
                  title="En Proceso" 
                  color="#F59E0B"
                  tasks={tasks.filter(t => t.status === 'doing')} 
                  onTaskClick={setFocusedTask}
                  onDelete={handleTaskDelete}
                  projects={projects}
                  isOver={overColumnId === 'doing'}
                  isDragging={!!activeId}
                />
                <KanbanColumn 
                  id="done"
                  title="Hecho" 
                  color="#10B981"
                  tasks={tasks.filter(t => t.status === 'done')} 
                  onTaskClick={setFocusedTask}
                  onDelete={handleTaskDelete}
                  projects={projects}
                  isOver={overColumnId === 'done'}
                  isDragging={!!activeId}
                />
              </motion.div>

              <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.4',
                    },
                  },
                }),
              }}>
                {activeTask ? (
                  <div className="w-72 rotate-1 scale-[1.02] shadow-2xl shadow-black/50">
                    <KanbanCard task={activeTask} onClick={() => {}} projects={projects} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {view === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full p-12 pl-24 overflow-y-auto"
            >
              <div className="max-w-6xl mx-auto h-full flex flex-col">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-display font-bold">Mis Proyectos</h2>
                  
                  <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="glass rounded-lg p-1 flex items-center gap-1">
                      <button
                        onClick={() => setProjectsViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          projectsViewMode === 'grid'
                            ? 'bg-flow-accent text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProjectsViewMode('calendar')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          projectsViewMode === 'calendar'
                            ? 'bg-flow-accent text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-flow-accent text-white font-medium text-sm hover:shadow-lg transition-all active:scale-95"
                      onClick={() => {
                        // Logic for new project could go here
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Proyecto
                    </button>
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {projectsViewMode === 'grid' ? (
                    <motion.div
                      key="grid-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-32"
                    >
                      {projects.length > 0 ? projects.map(project => (
                        <div key={project.id} className="glass rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-white/40">{project.name}</h3>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#3b82f6' }} />
                          </div>
                          <div className="space-y-2">
                            {tasks.filter(t => t.project_id === project.id).map(task => (
                              <div 
                                key={task.id}
                                onClick={() => setFocusedTask(task)}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                              >
                                <span className="text-sm font-medium group-hover:text-flow-accent">{task.title}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                                  task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <div className="glass rounded-2xl p-6 space-y-4 col-span-full">
                          <h3 className="text-sm font-mono uppercase tracking-widest text-white/40">Todas las Tareas</h3>
                          <div className="space-y-2">
                            {tasks.map(task => (
                              <div 
                                key={task.id}
                                onClick={() => setFocusedTask(task)}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                              >
                                <span className="text-sm font-medium group-hover:text-flow-accent">{task.title}</span>
                                <div className="flex items-center gap-3">
                                  {task.priority === 3 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                                    task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                                  }`}>
                                    {task.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="calendar-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex-1 pb-12"
                    >
                      <CalendarView 
                        tasks={tasks}
                        projects={projects}
                        onTaskClick={setFocusedTask}
                        weekStartsOn={weekStartsOn}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {view === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-12 pl-24 overflow-y-auto"
            >
              <AnalyticsView tasks={tasks} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-8 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold">Ajustes de Flujo</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Auto-inicio de Pomodoro</p>
                    <p className="text-xs text-white/40">Iniciar el tiempo al abrir una tarea</p>
                  </div>
                  <button
                    onClick={() => setAutoStartPomodoro(!autoStartPomodoro)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${autoStartPomodoro ? 'bg-flow-accent' : 'bg-white/10'}`}
                  >
                    <motion.div
                      animate={{ x: autoStartPomodoro ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Inicio de semana</p>
                    <p className="text-xs text-white/40">Día en que comienza la semana en el calendario</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeekStartsOn(1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        weekStartsOn === 1 ? 'bg-flow-accent text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
                      }`}
                    >
                      Lunes
                    </button>
                    <button
                      onClick={() => setWeekStartsOn(0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        weekStartsOn === 0 ? 'bg-flow-accent text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
                      }`}
                    >
                      Domingo
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">The Flow OS v1.0</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isDeletingTask && setTaskToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-display font-semibold">Confirmar eliminación</h2>
                  <p className="text-sm text-white/50">
                    Esta acción eliminará permanentemente la tarea.
                  </p>
                  <p className="text-sm text-white/80 break-words">
                    <span className="text-white/40">Tarea:</span> {taskToDelete.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => setTaskToDelete(null)}
                  disabled={isDeletingTask}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmTaskDelete}
                  disabled={isDeletingTask}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingTask ? 'Eliminando...' : 'Si, eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlays */}
      <CommandBar onTaskCreated={handleTaskCreated} />
      <FocusMode 
        task={focusedTask} 
        projects={projects}
        onClose={() => setFocusedTask(null)} 
        onComplete={handleTaskComplete} 
        onUpdate={handleUpdateTask}
        autoStart={autoStartPomodoro}
      />

      {/* Keyboard Hint */}
      <div className="fixed bottom-6 right-8 text-white/20 text-xs font-mono flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded border border-white/10">CTRL</span>
        <span>+</span>
        <span className="px-1.5 py-0.5 rounded border border-white/10">ESPACIO</span>
        <span className="ml-2">para capturar</span>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all relative group ${active ? 'bg-flow-accent text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="absolute left-full ml-4 px-2 py-1 rounded bg-white text-black text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

function DropZone({ label, color }: { label: string, color: string }) {
  return (
    <div className={`px-10 py-6 rounded-2xl border-2 border-dashed border-white/10 ${color} flex flex-col items-center justify-center min-w-[180px] backdrop-blur-sm transition-all hover:border-white/20`}>
      <span className="text-[10px] opacity-30 uppercase tracking-widest mb-1">Arrastra aquí</span>
      <span className="text-sm font-bold uppercase tracking-widest text-white/60">{label}</span>
    </div>
  );
}

function KanbanColumn({ id, title, subtitle, color, tasks, onTaskClick, onDelete, projects, isOver, isDragging }: { id: string, title: string, subtitle?: string, color: string, tasks: Task[], onTaskClick: (task: Task) => void, onDelete: (id: string) => void, projects: Project[], isOver?: boolean, isDragging?: boolean }) {
  const { setNodeRef, isOver: isDirectlyOver } = useDroppable({ id });
  const highlighted = isOver || isDirectlyOver;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'backlog': return <Clock className="w-3.5 h-3.5 text-white/40" />;
      case 'todo': return <Zap className="w-3.5 h-3.5 text-flow-accent" />;
      case 'doing': return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}><Settings className="w-3.5 h-3.5 text-amber-400" /></motion.div>;
      case 'done': return <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /></div>;
      default: return null;
    }
  };

  return (
    <div className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors duration-200 ${
      highlighted && isDragging ? 'bg-white/[0.03]' : ''
    }`}>
      {/* Column header - Notion style */}
      <div className="flex items-center gap-2 px-2 pb-3 mb-1">
        <div
          className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-transform duration-200 ${
            highlighted && isDragging ? 'scale-125' : ''
          }`}
          style={{ backgroundColor: color }}
        />
        {getStatusIcon(id)}
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        {subtitle && (
          <span className="text-[10px] text-white/25 font-normal">{subtitle}</span>
        )}
        <span className={`text-[11px] font-mono ml-auto transition-colors duration-200 ${
          highlighted && isDragging ? 'text-white/50' : 'text-white/25'
        }`}>{tasks.length}</span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[500px] pb-20 px-1 rounded-lg transition-all duration-200 ${
          highlighted && isDragging
            ? 'ring-1 ring-white/10 bg-white/[0.02]'
            : isDragging ? 'ring-1 ring-transparent' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard 
              key={task.id} 
              task={task} 
              onClick={onTaskClick} 
              onDelete={onDelete}
              projects={projects}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && !isDragging && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-8 h-8 rounded-lg border border-dashed border-white/10 flex items-center justify-center mb-2 hover:bg-white/5 text-white/20 hover:text-white/40 text-xs font-medium transition-all">
              <Plus className="w-3.5 h-3.5 text-white/15 group-hover/add:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-white/15">Sin tareas</p>
          </div>
        )}

        {/* Drop hint when dragging over empty column */}
        {tasks.length === 0 && isDragging && (
          <div className={`flex items-center justify-center py-10 rounded-lg border border-dashed transition-all duration-200 ${
            highlighted ? 'border-white/20 bg-white/[0.03]' : 'border-white/5'
          }`}>
            <p className={`text-[11px] transition-colors duration-200 ${
              highlighted ? 'text-white/40' : 'text-white/10'
            }`}>Soltar aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
