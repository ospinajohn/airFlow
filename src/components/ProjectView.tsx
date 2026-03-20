import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Calendar, Plus, Folder, CheckCircle2,
  AlertCircle, Clock, ArrowLeft, Zap, BarChart3,
  TrendingUp, AlertTriangle, Edit2, Trash2,
} from 'lucide-react';
import { Task, Project } from '../types';
import { CalendarView } from './CalendarView';
import { format, isWithinInterval, startOfWeek, endOfWeek, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectWorkload {
  id: string;
  name: string;
  color: string;
  active: number;
  dueThisWeek: number;
  overdue: number;
  loadLevel: 'high' | 'medium' | 'low';
}

interface ProjectViewProps {
  tasks: Task[];
  projects: Project[];
  projectWorkload: ProjectWorkload[];
  projectsViewMode: 'grid' | 'calendar';
  setProjectsViewMode: (mode: 'grid' | 'calendar') => void;
  openCreateProjectModal: () => void;
  openEditProjectModal: (project: Project) => void;
  handleDeleteProject: (project: Project) => void;
  setFocusedTask: (task: Task) => void;
  weekStartsOn: 0 | 1;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  tasks,
  projects,
  projectWorkload,
  projectsViewMode,
  setProjectsViewMode,
  openCreateProjectModal,
  openEditProjectModal,
  handleDeleteProject,
  setFocusedTask,
  weekStartsOn,
}) => {
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  const totalActive = tasks.filter((t) => t.status !== 'done').length;
  const totalDone = tasks.filter((t) => t.status === 'done').length;
  const totalOverdue = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && isBefore(new Date(t.due_date), new Date()),
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 md:p-12 md:pl-24 pt-24 md:pt-12 pb-32 md:pb-12 overflow-y-auto no-scrollbar"
    >
      <AnimatePresence mode="wait">
        {selectedProject ? (
          <ProjectDetail
            key="detail"
            project={selectedProject}
            tasks={tasks.filter((t) => t.project_id === selectedProject.id)}
            allTasks={tasks}
            onBack={() => setSelectedProject(null)}
            onEdit={() => openEditProjectModal(selectedProject)}
            onDelete={() => { handleDeleteProject(selectedProject); setSelectedProject(null); }}
            onTaskClick={setFocusedTask}
            onCreateTask={openCreateProjectModal}
          />
        ) : (
          <ProjectGrid
            key="grid"
            tasks={tasks}
            projects={projects}
            projectWorkload={projectWorkload}
            projectsViewMode={projectsViewMode}
            setProjectsViewMode={setProjectsViewMode}
            openCreateProjectModal={openCreateProjectModal}
            openEditProjectModal={openEditProjectModal}
            handleDeleteProject={handleDeleteProject}
            setFocusedTask={setFocusedTask}
            weekStartsOn={weekStartsOn}
            totalActive={totalActive}
            totalDone={totalDone}
            totalOverdue={totalOverdue}
            onSelectProject={setSelectedProject}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Project Grid ─────────────────────────────────────────────────────────────

function ProjectGrid({
  tasks, projects, projectWorkload, projectsViewMode, setProjectsViewMode,
  openCreateProjectModal, openEditProjectModal, handleDeleteProject,
  setFocusedTask, weekStartsOn, totalActive, totalDone, totalOverdue, onSelectProject,
}: ProjectViewProps & { totalActive: number; totalDone: number; totalOverdue: number; onSelectProject: (p: Project) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-flow-accent font-mono text-xs tracking-widest uppercase">
            <Folder className="w-4 h-4" />
            <span>Workspace</span>
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tight">Mis Proyectos</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Pill color="white" value={`${projects.length} proyectos`} dot="rgba(255,255,255,0.3)" />
            <Pill color="#3b82f6" value={`${totalActive} activas`} dot="#3b82f6" />
            <Pill color="#10b981" value={`${totalDone} completadas`} dot="#10b981" />
            {totalOverdue > 0 && <Pill color="#f87171" value={`${totalOverdue} vencidas`} dot="#f87171" />}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="glass rounded-xl p-1 flex items-center gap-1 border border-white/[0.05]">
            <button
              onClick={() => setProjectsViewMode('grid')}
              className={`px-3 py-2 rounded-lg text-xs transition-all ${projectsViewMode === 'grid' ? 'bg-flow-accent/20 text-flow-accent' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setProjectsViewMode('calendar')}
              className={`px-3 py-2 rounded-lg text-xs transition-all ${projectsViewMode === 'calendar' ? 'bg-flow-accent/20 text-flow-accent' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={openCreateProjectModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-flow-accent text-white font-semibold text-sm hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {projectsViewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4"
          >
            {projects.length > 0 ? (
              projects.map((project, index) => {
                const projectTasks = tasks.filter((t) => t.project_id === project.id);
                const done = projectTasks.filter((t) => t.status === 'done').length;
                const total = projectTasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const overdue = projectTasks.filter(
                  (t) => t.status !== 'done' && t.due_date && isBefore(new Date(t.due_date), new Date()),
                ).length;
                const color = project.color || '#3b82f6';
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={projectTasks}
                    done={done}
                    total={total}
                    pct={pct}
                    overdue={overdue}
                    color={color}
                    index={index}
                    onEdit={(e) => { e.stopPropagation(); openEditProjectModal(project); }}
                    onDelete={(e) => { e.stopPropagation(); handleDeleteProject(project); }}
                    onTaskClick={setFocusedTask}
                    onClick={() => onSelectProject(project)}
                  />
                );
              })
            ) : (
              <EmptyState tasks={tasks} onCreateProject={openCreateProjectModal} onTaskClick={setFocusedTask} />
            )}
          </motion.div>
        ) : (
          <motion.div key="calendar" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex-1 pb-12">
            <CalendarView tasks={tasks} projects={projects} onTaskClick={setFocusedTask} weekStartsOn={weekStartsOn} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────

function ProjectDetail({
  project, tasks, allTasks, onBack, onEdit, onDelete, onTaskClick, onCreateTask,
}: {
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTaskClick: (t: Task) => void;
  onCreateTask: () => void;
  key?: React.Key;
}) {
  const color = project.color || '#3b82f6';
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const byStatus = {
    backlog: tasks.filter((t) => t.status === 'backlog'),
    todo: tasks.filter((t) => t.status === 'todo'),
    doing: tasks.filter((t) => t.status === 'doing'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const total = tasks.length;
  const done = byStatus.done.length;
  const active = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const overdue = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && isBefore(new Date(t.due_date), new Date()),
  );

  const velocity = byStatus.done.filter((t) => {
    if (!t.completed_at) return false;
    return isWithinInterval(new Date(t.completed_at), { start: weekStart, end: weekEnd });
  }).length;

  const recentActivity = [...byStatus.done]
    .filter((t) => t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5);

  const statusDist = [
    { label: 'Backlog', count: byStatus.backlog.length, color: 'rgba(255,255,255,0.2)' },
    { label: 'Hoy', count: byStatus.todo.length, color: '#3b82f6' },
    { label: 'En proceso', count: byStatus.doing.length, color: '#f59e0b' },
    { label: 'Hecho', count: byStatus.done.length, color: '#10b981' },
  ].filter((s) => s.count > 0);

  // Salud del proyecto: Calculada en base a vencidas y ritmo
  const health = overdue.length > 3 ? 'risk' : overdue.length > 0 ? 'warning' : pct > 80 ? 'optimal' : 'stable';
  const healthConfig = {
    risk: { label: 'En Riesgo', color: '#f43f5e', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    warning: { label: 'Atención', color: '#f59e0b', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    stable: { label: 'Estable', color: '#3b82f6', icon: <Clock className="w-3.5 h-3.5" /> },
    optimal: { label: 'Óptimo', color: '#10b981', icon: <Zap className="w-3.5 h-3.5" /> },
  }[health];

  return (
    <motion.div
      layoutId={`card-${project.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto flex flex-col gap-8 relative"
    >
      {/* Background Aura */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] pointer-events-none opacity-[0.03] transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
          filter: 'blur(120px)'
        }}
      />

      {/* Back + actions */}
      <div className="flex items-center justify-between relative z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-all group px-4 py-2 rounded-xl hover:bg-white/5"
        >
          <motion.div whileHover={{ x: -3 }} transition={{ type: 'spring', stiffness: 400 }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-mono tracking-wider">Ecosistemas</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white/80 text-[10px] font-mono uppercase tracking-[0.2em] transition-all border border-white/[0.05]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Config
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-500/40 hover:text-red-400 text-[10px] font-mono uppercase tracking-[0.2em] transition-all border border-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Borrar
          </button>
        </div>
      </div>

      {/* Hero - Liquid Style */}
      <div
        className="glass rounded-[2.5rem] p-10 border relative overflow-hidden group/hero shadow-2xl"
        style={{ borderColor: `${color}15` }}
      >
        {/* Animated Background Aura */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ backgroundColor: color, filter: 'blur(80px)' }}
        />
        
        <div className="relative z-10 flex flex-col gap-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                layoutId={`dot-${project.id}`}
                className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color, boxShadow: `0 0 25px ${color}` }}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Ambiente Activo</p>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: `${healthConfig.color}10`, color: healthConfig.color, borderColor: `${healthConfig.color}30` }}
                  >
                    {healthConfig.icon}
                    {healthConfig.label}
                  </motion.div>
                </div>
                <motion.h1 
                  layoutId={`title-${project.id}`}
                  className="text-4xl md:text-5xl font-display font-black tracking-tight text-white leading-tight"
                >
                  {project.name}
                </motion.h1>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateTask}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
              style={{
                backgroundColor: color,
                color: '#fff',
                boxShadow: `0 10px 30px ${color}40`,
              }}
            >
              <Plus className="w-5 h-5" />
              Nueva Tarea
            </motion.button>
          </div>

          {/* Liquid Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-end justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Ritmo de Flujo</span>
                <span className="text-sm font-display font-bold text-white/60">{done} de {total} completadas</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-4xl font-display font-black leading-none" style={{ color }}>{pct}<span className="text-xl opacity-40 ml-1">%</span></span>
              </div>
            </div>
            <div className="w-full h-4 bg-white/[0.03] rounded-full p-1 border border-white/[0.05] relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full relative"
                style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}50` }}
              >
                {/* Liquid Shine Effect */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Estilo Hito */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Folder className="w-5 h-5" />, label: 'Universo', value: total, color: 'rgba(255,255,255,0.7)', accent: 'rgba(255,255,255,0.05)' },
          { icon: <Zap className="w-5 h-5" />, label: 'Activas', value: active, color: '#3b82f6', accent: 'rgba(59,130,246,0.1)' },
          { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Hecho', value: done, color: '#10b981', accent: 'rgba(16,185,129,0.1)' },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Weekly Velocity', value: velocity, color: '#f59e0b', accent: 'rgba(245,158,11,0.1)', special: true },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`glass rounded-3xl p-6 border flex flex-col gap-4 relative overflow-hidden group/metric ${m.special ? 'border-amber-500/20 shadow-[0_15px_40px_-15px_rgba(245,158,11,0.15)]' : 'border-white/[0.04]'}`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover/metric:scale-110 duration-500" style={{ backgroundColor: m.accent, color: m.color }}>
                {m.icon}
              </div>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] font-black">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-display font-black tracking-tight" style={{ color: m.color }}>{m.value}</p>
              {m.special && <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Tareas</span>}
            </div>
            
            {/* Ambient background glow for specialty metrics */}
            {m.special && (
              <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: m.color }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Fila inferior: distribución + overdue + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Distribución por estado */}
        <div className="lg:col-span-4 glass rounded-3xl p-6 border border-white/[0.04] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-white/30" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Distribución</p>
          </div>
          {total === 0 ? (
            <p className="text-sm text-white/20 font-mono">Sin tareas aún</p>
          ) : (
            <div className="space-y-3">
              {statusDist.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-white/40">{s.label}</span>
                    <span className="text-[11px] font-mono text-white/50">{s.count} · {Math.round((s.count / total) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / total) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vencidas */}
        <div className="lg:col-span-4 glass rounded-3xl p-6 border flex flex-col gap-4"
          style={{ borderColor: overdue.length > 0 ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: overdue.length > 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }} />
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: overdue.length > 0 ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.3)' }}>
              Vencidas · {overdue.length}
            </p>
          </div>
          {overdue.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400/40" />
              <p className="text-[11px] font-mono text-white/25">Todo al día</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto no-scrollbar">
              {overdue.map((task) => (
                <motion.div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  whileHover={{ x: 3 }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/[0.06] hover:bg-red-500/10 border border-red-500/10 cursor-pointer transition-colors"
                >
                  <span className="text-[12px] text-white/60 hover:text-white/80 truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="text-[10px] font-mono text-red-400/60 ml-2 shrink-0">
                      {format(new Date(task.due_date), 'd MMM', { locale: es })}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline de actividad */}
        <div className="lg:col-span-4 glass rounded-3xl p-6 border border-white/[0.04] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/30" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Actividad reciente</p>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
              <p className="text-[11px] font-mono text-white/20">Sin completadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onTaskClick(task)}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60 group-hover:bg-emerald-400 transition-colors" />
                    {i < recentActivity.length - 1 && (
                      <div className="w-px h-4 bg-white/[0.06]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-white/55 group-hover:text-white/80 transition-colors truncate">{task.title}</p>
                    {task.completed_at && (
                      <p className="text-[10px] font-mono text-white/20 mt-0.5">
                        {format(new Date(task.completed_at), "d MMM · HH:mm", { locale: es })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista completa de tareas activas */}
      {active > 0 && (
        <div className="glass rounded-3xl p-6 border border-white/[0.04] flex flex-col gap-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
            Todas las tareas activas · {active}
          </p>
          {(['doing', 'todo', 'backlog'] as const).map((status) => {
            const group = byStatus[status];
            if (group.length === 0) return null;
            const groupConfig = {
              doing: { label: 'En proceso', color: '#f59e0b' },
              todo: { label: 'Hoy', color: '#3b82f6' },
              backlog: { label: 'Pendiente', color: 'rgba(255,255,255,0.25)' },
            };
            const gc = groupConfig[status];
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: gc.color }} />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{gc.label} · {group.length}</p>
                </div>
                <div className="space-y-1.5">
                  {group.map((task) => (
                    <TaskRow key={task.id} task={task} color={color} onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project, tasks, done, total, pct, overdue, color, index,
  onEdit, onDelete, onTaskClick, onClick,
}: {
  project: Project; tasks: Task[]; done: number; total: number;
  pct: number; overdue: number; color: string; index: number;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onTaskClick: (t: Task) => void;
  onClick: () => void;
  key?: React.Key;
}) {
  const [hovered, setHovered] = React.useState(false);
  const activeTasks = tasks.filter((t) => t.status !== 'done');

  return (
    <motion.div
      layoutId={`card-${project.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="glass rounded-[2rem] p-7 flex flex-col gap-6 border relative overflow-hidden cursor-pointer select-none group/card"
      style={{
        transition: 'border-color 0.35s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)',
        borderColor: hovered ? `${color}40` : 'rgba(255,255,255,0.03)',
      }}
    >
      {/* Liquid Light Streak on Hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 z-0"
          />
        )}
      </AnimatePresence>

      <motion.div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
        style={{ backgroundColor: color }}
        animate={{ opacity: hovered ? 0.08 : 0.03, scale: hovered ? 1.4 : 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <motion.div
            layoutId={`dot-${project.id}`}
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}80` }}
            animate={{ scale: hovered ? 1.2 : 1 }}
          />
          <motion.h3 
            layoutId={`title-${project.id}`}
            className="text-xl font-display font-black tracking-tight text-white/90 group-hover/card:text-white transition-colors truncate"
          >
            {project.name}
          </motion.h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.div className="flex items-center gap-1.5" animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 10 }}>
            <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500/50 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
          </motion.div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] font-black">Progreso</span>
          <motion.span className="text-xs font-mono font-black" animate={{ color: hovered ? color : 'rgba(255,255,255,0.2)' }}>
            {pct}%
          </motion.span>
        </div>
        <div className="w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]" style={{ height: 6 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: index * 0.06 + 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: color, boxShadow: hovered ? `0 0 15px ${color}80` : `0 0 5px ${color}30` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: 'Total', value: total, cls: 'text-white/70' },
          { label: 'Activas', value: total - done, cls: 'text-flow-accent' },
          { label: 'Hechas', value: done, cls: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2.5 flex flex-col gap-0.5" style={{ transition: 'border-color 0.3s', borderColor: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] font-mono text-white/25 uppercase tracking-widest">{s.label}</p>
            <p className={`text-xl font-display font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Task preview */}
      <div className="space-y-1.5 relative z-10">
        {activeTasks.length === 0 && done === 0 ? (
          <div className="py-5 flex flex-col items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center border border-dashed" style={{ borderColor: `${color}30` }}>
              <Plus className="w-3.5 h-3.5" style={{ color: `${color}50` }} />
            </div>
            <p className="text-[11px] text-white/20 font-mono">Sin tareas aún</p>
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="py-3 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400/50" />
            <p className="text-[11px] text-emerald-400/50 font-mono">Todas completadas</p>
          </div>
        ) : (
          <>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Pendientes</p>
            {activeTasks.slice(0, 3).map((task) => (
              <TaskRow key={task.id} task={task} color={color} onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} />
            ))}
            {activeTasks.length > 3 && (
              <p className="text-[10px] font-mono text-white/20 px-2">+{activeTasks.length - 3} más — click para ver todo</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, color, onClick }: { task: Task; color: string; onClick: (e: React.MouseEvent) => void; key?: React.Key }) {
  const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date()) && task.status !== 'done';
  const sc: Record<string, string> = {
    doing: 'text-amber-400/80 bg-amber-500/10 border-amber-500/15',
    todo: 'text-flow-accent/80 bg-flow-accent/10 border-flow-accent/15',
    backlog: 'text-white/30 bg-white/[0.04] border-white/[0.06]',
    done: 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/15',
  };
  const sl: Record<string, string> = { doing: 'En proceso', todo: 'Hoy', backlog: 'Pendiente', done: 'Hecho' };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06] transition-colors cursor-pointer group relative overflow-hidden"
    >
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 1 }}
      />
      <div className="flex items-center gap-2.5 min-w-0">
        {task.priority === 3 && <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.7)] flex-shrink-0" />}
        {isOverdue && <Clock className="w-3 h-3 text-red-400/70 flex-shrink-0" />}
        <span className="text-[12px] font-medium text-white/60 group-hover:text-white/85 transition-colors truncate">{task.title}</span>
      </div>
      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${sc[task.status] ?? sc.backlog}`}>
        {sl[task.status] ?? task.status}
      </span>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tasks, onCreateProject, onTaskClick }: { tasks: Task[]; onCreateProject: () => void; onTaskClick: (t: Task) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full glass rounded-3xl p-8 border border-white/[0.04] flex flex-col gap-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-display font-semibold text-white/90">Sin proyectos todavía</h3>
          <p className="text-sm text-white/35">Agrupa tus tareas para tener más claridad operativa.</p>
        </div>
        <button onClick={onCreateProject} className="px-5 py-2.5 rounded-2xl bg-flow-accent/15 text-flow-accent text-sm font-semibold hover:bg-flow-accent hover:text-white transition-all border border-flow-accent/20 hover:border-transparent">
          Crear primero
        </button>
      </div>
      {tasks.length > 0 && (
        <>
          <div className="h-px bg-white/[0.05]" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3">Bandeja universal · {tasks.length} tareas</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} color="#3b82f6" onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} />
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ color, value, dot }: { color: string; value: string; dot: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-full border"
      style={{ color: `${color}80`, backgroundColor: `${dot}10`, borderColor: `${dot}20` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {value}
    </span>
  );
}