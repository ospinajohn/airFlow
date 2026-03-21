import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Folder, CheckCircle2, AlertCircle, Clock,
  Zap, TrendingUp, AlertTriangle, Edit2, Trash2,
  Calendar, BarChart3,
} from 'lucide-react';
import { Task, Project } from '../types';
import {
  format, isWithinInterval, startOfWeek, endOfWeek, isBefore,
} from 'date-fns';
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
  openCreateProjectModal: () => void;
  openEditProjectModal: (project: Project) => void;
  handleDeleteProject: (project: Project) => void;
  setFocusedTask: (task: Task) => void;
  weekStartsOn: 0 | 1;
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Pendiente', todo: 'Hoy', doing: 'En proceso', done: 'Hecho',
};
const STATUS_CLS: Record<string, string> = {
  backlog: 'text-white/25 bg-white/[0.03] border-white/[0.06]',
  todo: 'text-blue-400/70 bg-blue-500/10 border-blue-500/15',
  doing: 'text-amber-400/70 bg-amber-500/10 border-amber-500/15',
  done: 'text-emerald-400/70 bg-emerald-500/10 border-emerald-500/15',
};

export const ProjectView: React.FC<ProjectViewProps> = ({
  tasks, projects, projectWorkload,
  openCreateProjectModal, openEditProjectModal,
  handleDeleteProject, setFocusedTask,
}) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    projects[0]?.id ?? null,
  );

  // Keep selection valid when projects change
  React.useEffect(() => {
    if (!projects.find((p) => p.id === selectedId)) {
      setSelectedId(projects[0]?.id ?? null);
    }
  }, [projects]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const selectedTasks = useMemo(
    () => tasks.filter((t) => t.project_id === selectedId),
    [tasks, selectedId],
  );

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
      className="h-full p-6 md:p-10 md:pl-24 pt-24 md:pt-10 pb-28 md:pb-10 flex flex-col gap-6 overflow-hidden"
    >
      {/* ── Top header ── */}
      <div className="flex items-end justify-between shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-flow-accent font-mono text-xs tracking-widest uppercase">
            <Folder className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Proyectos</h2>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Pill dot="rgba(255,255,255,0.25)" value={`${projects.length} proyectos`} />
            <Pill dot="#3b82f6" value={`${totalActive} activas`} dimColor="rgba(59,130,246,0.7)" />
            <Pill dot="#10b981" value={`${totalDone} completadas`} dimColor="rgba(16,185,129,0.7)" />
            {totalOverdue > 0 && (
              <Pill dot="#f87171" value={`${totalOverdue} vencidas`} dimColor="rgba(248,113,113,0.7)" />
            )}
          </div>
        </div>
        <button
          onClick={openCreateProjectModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white/90 text-sm font-mono uppercase tracking-widest border border-white/[0.08] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* ── Split layout ── */}
      {projects.length === 0 ? (
        <EmptyState tasks={tasks} onCreateProject={openCreateProjectModal} onTaskClick={setFocusedTask} />
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">

          {/* Sidebar */}
          <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto no-scrollbar">
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] px-2 pb-2 border-b border-white/[0.04] mb-1">
              {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
            </p>
            {projects.map((project) => {
              const ptasks = tasks.filter((t) => t.project_id === project.id);
              const pdone = ptasks.filter((t) => t.status === 'done').length;
              const ppct = ptasks.length > 0 ? Math.round((pdone / ptasks.length) * 100) : 0;
              const pOverdue = ptasks.filter(
                (t) => t.status !== 'done' && t.due_date && isBefore(new Date(t.due_date), new Date()),
              ).length;
              const isActive = selectedId === project.id;
              const color = project.color || '#3b82f6';

              return (
                <motion.button
                  key={project.id}
                  onClick={() => setSelectedId(project.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative overflow-hidden ${isActive
                      ? 'bg-white/[0.06] border border-white/[0.08]'
                      : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.04]'
                    }`}
                  whileHover={{ x: isActive ? 0 : 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* Active left accent */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-accent"
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}

                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 ml-1"
                    style={{
                      backgroundColor: color,
                      boxShadow: isActive ? `0 0 8px ${color}60` : 'none',
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-medium truncate transition-colors ${isActive ? 'text-white/85' : 'text-white/45 group-hover:text-white/65'
                      }`}>
                      {project.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${ppct}%`, backgroundColor: isActive ? color : 'rgba(255,255,255,0.15)' }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-white/20 shrink-0">{ppct}%</span>
                    </div>
                  </div>

                  {pOverdue > 0 && (
                    <div className="w-4 h-4 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-mono text-red-400/70">{pOverdue}</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              {selected ? (
                <DetailPanel
                  key={selected.id}
                  project={selected}
                  tasks={selectedTasks}
                  onEdit={() => openEditProjectModal(selected)}
                  onDelete={() => { handleDeleteProject(selected); }}
                  onTaskClick={setFocusedTask}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  project, tasks, onEdit, onDelete, onTaskClick,
}: {
  project: Project;
  tasks: Task[];
  onEdit: () => void;
  onDelete: () => void;
  onTaskClick: (t: Task) => void;
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

  const recentDone = [...byStatus.done]
    .filter((t) => t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 4);

  const health = overdue.length > 3 ? 'risk'
    : overdue.length > 0 ? 'warning'
      : pct >= 80 ? 'optimal'
        : 'stable';

  const healthCfg = {
    risk: { label: 'En riesgo', cls: 'text-red-400/60 bg-red-500/[0.06] border-red-500/10' },
    warning: { label: 'Atención', cls: 'text-amber-400/60 bg-amber-500/[0.06] border-amber-500/10' },
    stable: { label: 'Estable', cls: 'text-white/30 bg-white/[0.03] border-white/[0.06]' },
    optimal: { label: 'Óptimo', cls: 'text-emerald-400/60 bg-emerald-500/[0.06] border-emerald-500/10' },
  }[health];

  const statusDist = [
    { label: 'Pendiente', count: byStatus.backlog.length, color: 'rgba(255,255,255,0.15)' },
    { label: 'Hoy', count: byStatus.todo.length, color: '#3b82f650' },
    { label: 'En proceso', count: byStatus.doing.length, color: '#f59e0b50' },
    { label: 'Hecho', count: byStatus.done.length, color: '#10b98150' },
  ].filter((s) => s.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 pb-4"
    >
      {/* Hero card */}
      <div
        className="glass rounded-3xl p-6 border relative overflow-hidden"
        style={{ borderColor: `${color}18` }}
      >
        {/* Subtle background glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ backgroundColor: color, opacity: 0.04, filter: 'blur(40px)' }}
        />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}60` }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-2xl font-display font-bold tracking-tight text-white/90">
                    {project.name}
                  </h3>
                  <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${healthCfg.cls}`}>
                    {healthCfg.label}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/20 mt-1">
                  {total} tareas · última actualización reciente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/35 hover:text-white/60 text-[10px] font-mono uppercase tracking-widest border border-white/[0.05] transition-all"
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/[0.05] hover:bg-red-500/10 text-red-500/40 hover:text-red-400/70 text-[10px] font-mono uppercase tracking-widest border border-red-500/[0.08] transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-end gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">Progreso general</span>
                <span className="text-3xl font-display font-bold leading-none" style={{ color }}>
                  {pct}<span className="text-base text-white/20 ml-0.5">%</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.03]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}50` }}
                />
              </div>
              <p className="text-[10px] font-mono text-white/20">{done} de {total} completadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Folder className="w-4 h-4" />, label: 'Total', value: total, color: 'rgba(255,255,255,0.6)' },
          { icon: <Zap className="w-4 h-4" />, label: 'Activas', value: active, color: 'rgba(255,255,255,0.5)' },
          { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Completadas', value: done, color: 'rgba(255,255,255,0.5)' },
          { icon: <TrendingUp className="w-4 h-4" />, label: 'Esta semana', value: velocity, color: 'rgba(255,255,255,0.5)' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl px-4 py-3.5 border border-white/[0.04] flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="text-white/20">{m.icon}</div>
              <span className="text-[9px] font-mono text-white/15 uppercase tracking-widest">{m.label}</span>
            </div>
            <p className="text-3xl font-display font-bold leading-none" style={{ color: m.color }}>
              {m.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Bottom row: dist + overdue + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Distribución */}
        <div className="glass rounded-2xl p-5 border border-white/[0.04] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-white/20" />
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Distribución</span>
          </div>
          {total === 0 ? (
            <p className="text-[11px] font-mono text-white/15">Sin tareas aún</p>
          ) : (
            <div className="space-y-2.5">
              {statusDist.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/30">{s.label}</span>
                    <span className="text-[10px] font-mono text-white/20">
                      {s.count} · {Math.round((s.count / total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / total) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
        <div
          className="glass rounded-2xl p-5 border flex flex-col gap-4"
          style={{ borderColor: overdue.length > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="w-3.5 h-3.5"
              style={{ color: overdue.length > 0 ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.15)' }}
            />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: overdue.length > 0 ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.2)' }}
            >
              Vencidas · {overdue.length}
            </span>
          </div>
          {overdue.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3">
              <CheckCircle2 className="w-5 h-5 text-white/10" />
              <p className="text-[10px] font-mono text-white/15">Al día</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {overdue.map((task) => (
                <motion.div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-red-500/[0.04] hover:bg-red-500/[0.08] border border-red-500/[0.08] cursor-pointer transition-all"
                >
                  <span className="text-[11px] text-white/45 hover:text-white/70 truncate transition-colors">
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-[9px] font-mono text-red-400/40 ml-2 shrink-0">
                      {format(new Date(task.due_date), 'd MMM', { locale: es })}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="glass rounded-2xl p-5 border border-white/[0.04] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-white/20" />
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Actividad reciente</span>
          </div>
          {recentDone.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3">
              <p className="text-[10px] font-mono text-white/15">Sin completadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDone.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onTaskClick(task)}
                  className="flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                    {i < recentDone.length - 1 && <div className="w-px h-3 bg-white/[0.05]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/40 group-hover:text-white/65 transition-colors truncate">
                      {task.title}
                    </p>
                    {task.completed_at && (
                      <p className="text-[9px] font-mono text-white/15 mt-0.5">
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

      {/* Active tasks */}
      {active > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/[0.04] flex flex-col gap-4">
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
            Tareas activas · {active}
          </span>
          {(['doing', 'todo', 'backlog'] as const).map((status) => {
            const group = byStatus[status];
            if (group.length === 0) return null;
            const gc = {
              doing: { label: 'En proceso', dot: '#f59e0b40' },
              todo: { label: 'Hoy', dot: '#3b82f640' },
              backlog: { label: 'Pendiente', dot: 'rgba(255,255,255,0.12)' },
            }[status];
            return (
              <div key={status} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: gc.dot }} />
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                    {gc.label} · {group.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      color={project.color || '#3b82f6'}
                      onClick={() => onTaskClick(task)}
                    />
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

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, color, onClick }: {
  task: Task; color: string; onClick: () => void;
}) {
  const isOverdue = task.due_date
    && isBefore(new Date(task.due_date), new Date())
    && task.status !== 'done';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05] transition-all cursor-pointer group relative overflow-hidden"
    >
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-px rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 0.6 }}
      />
      <div className="flex items-center gap-2 min-w-0">
        {task.priority === 3 && (
          <div className="w-1 h-1 rounded-full bg-red-400/60 flex-shrink-0" />
        )}
        {isOverdue && <Clock className="w-3 h-3 text-red-400/40 flex-shrink-0" />}
        <span className="text-[11px] text-white/40 group-hover:text-white/70 transition-colors truncate">
          {task.title}
        </span>
      </div>
      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 ml-2 ${STATUS_CLS[task.status] ?? STATUS_CLS.backlog}`}>
        {STATUS_LABEL[task.status] ?? task.status}
      </span>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tasks, onCreateProject, onTaskClick }: {
  tasks: Task[]; onCreateProject: () => void; onTaskClick: (t: Task) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 glass rounded-3xl p-8 border border-white/[0.04] flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-display font-semibold text-white/80">Sin proyectos todavía</h3>
          <p className="text-sm text-white/25">Agrupa tus tareas para tener más claridad.</p>
        </div>
        <button
          onClick={onCreateProject}
          className="px-5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-white/50 hover:text-white/80 text-sm font-mono uppercase tracking-widest border border-white/[0.07] transition-all"
        >
          Crear primero
        </button>
      </div>
      {tasks.length > 0 && (
        <>
          <div className="h-px bg-white/[0.04]" />
          <div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">
              Bandeja · {tasks.length} tareas sin proyecto
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} color="#3b82f6" onClick={() => onTaskClick(task)} />
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ dot, value, dimColor }: {
  dot: string; value: string; dimColor?: string;
}) {
  return (
    <span
      className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border"
      style={{
        color: dimColor || 'rgba(255,255,255,0.3)',
        backgroundColor: `${dot}10`,
        borderColor: `${dot}20`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {value}
    </span>
  );
}