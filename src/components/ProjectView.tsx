import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Calendar, Plus } from 'lucide-react';
import { Task, Project } from '../types';
import { CalendarView } from './CalendarView';

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
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 md:p-12 md:pl-24 pt-24 md:pt-12 pb-32 md:pb-12 overflow-y-auto no-scrollbar"
    >
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            Mis Proyectos
          </h2>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Switcher Glass */}
            <div className="glass rounded-xl p-1.5 flex items-center gap-1 border border-white/5">
              <button
                onClick={() => setProjectsViewMode("grid")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  projectsViewMode === "grid"
                    ? "bg-flow-accent/20 text-flow-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setProjectsViewMode("calendar")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  projectsViewMode === "calendar"
                    ? "bg-flow-accent/20 text-flow-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-flow-accent text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all active:scale-95"
              onClick={openCreateProjectModal}
            >
              <Plus className="w-5 h-5" />
              Nuevo
            </button>
          </div>
        </div>

        {/* Carga Operativa por Proyecto */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projectWorkload.map((item) => (
            <motion.div
              whileHover={{ y: -4 }}
              key={item.id}
              className="glass rounded-3xl p-5 flex flex-col gap-4 border border-white/5 relative overflow-hidden group"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${item.color}, transparent 70%)` }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }}
                  />
                  <h4 className="text-base font-display font-semibold text-white/90 truncate">
                    {item.name}
                  </h4>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${
                    item.loadLevel === "high"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : item.loadLevel === "medium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {item.loadLevel === "high" ? "Saturado" : item.loadLevel === "medium" ? "Moderado" : "Saludable"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 relative z-10">
                <div className="rounded-2xl bg-white/5 p-3 flex flex-col justify-center border border-white/5 transition-colors group-hover:border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Activas</p>
                  <p className="text-2xl font-display font-bold text-white/90">{item.active}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 flex flex-col justify-center border border-white/5 transition-colors group-hover:border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Due wk</p>
                  <p className="text-2xl font-display font-bold text-blue-400">{item.dueThisWeek}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 flex flex-col justify-center border border-white/5 transition-colors group-hover:border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Late</p>
                  <p className="text-2xl font-display font-bold text-rose-400">{item.overdue}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {projectsViewMode === "grid" ? (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-12"
            >
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="glass rounded-[2rem] p-7 flex flex-col gap-6 border border-white/5 group relative overflow-hidden"
                  >
                    {/* Subtle hover gleam specific to project color */}
                     <div 
                      className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
                      style={{ backgroundColor: project.color || "#3b82f6" }}
                    />

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-1.5 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || "#3b82f6" }}
                        />
                        <h3 className="text-xl font-display font-bold tracking-tight text-white/90 truncate">
                          {project.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditProjectModal(project)}
                          className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        >
                          Del
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                      {tasks.filter((t) => t.project_id === project.id).length === 0 ? (
                         <div className="p-4 rounded-2xl bg-white/5 text-center text-sm font-light text-white/30 italic">
                           Vacío por ahora...
                         </div>
                      ) : (
                        tasks
                          .filter((t) => t.project_id === project.id)
                          .map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setFocusedTask(task)}
                              className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                            >
                              {/* Hover flare indicator */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-transparent via-flow-accent to-transparent" />
                              
                              <div className="flex items-center gap-3">
                                {task.priority === 3 && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                                )}
                                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                                  {task.title}
                                </span>
                              </div>
                              
                              <span
                                className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                                  task.status === "done"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                    : task.status === "doing"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                      : task.status === "todo"
                                        ? "bg-flow-accent/10 text-flow-accent border-flow-accent/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                        : "bg-white/5 text-white/40 border-transparent"
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>
                          ))
                       )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass rounded-[2rem] p-8 col-span-full border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-display font-semibold text-white">
                        Sin proyectos creados aún
                      </h3>
                      <p className="text-sm text-white/40 mt-1">
                        Comienza a agrupar tus tareas para estructurar tu flujo.
                      </p>
                    </div>
                    <button
                      onClick={openCreateProjectModal}
                      className="px-5 py-2.5 rounded-xl bg-flow-accent/20 text-flow-accent text-sm font-bold tracking-wide hover:bg-flow-accent hover:text-white transition-all"
                    >
                      Hacerlo ahora
                    </button>
                  </div>
                  
                  <div className="w-full h-px bg-white/5 mb-8" />
                  
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
                    Bandeja universal
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setFocusedTask(task)}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300 cursor-pointer overflow-hidden relative"
                      >
                         <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center gap-3 relative z-10">
                          {task.priority === 3 ? (
                            <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                          ) : (
                             <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                          )}
                           <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                            {task.title}
                          </span>
                        </div>
                       
                        <span
                          className={`relative z-10 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                            task.status === "done"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/5 text-white/40 border-transparent"
                          }`}
                        >
                          {task.status}
                        </span>
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
  );
};
