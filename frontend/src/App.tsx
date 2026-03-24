import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutGrid,
  List,
  Calendar,
  Settings,
  Zap,
  Plus,
  X,
  AlertTriangle,
  Trash2,
  Clock,
  BarChart3,
  CheckSquare,
  Square,
  Keyboard,
} from "lucide-react";
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CommandBar } from "./components/CommandBar";
import { TaskBubble } from "./components/TaskBubble";
import { FocusMode } from "./components/FocusMode";
import { KanbanCard } from "./components/KanbanCard";
import { CalendarView } from "./components/CalendarView";
import { AnalyticsView } from "./components/AnalyticsView";
import { ProjectView } from "./components/ProjectView";
import { Task, Project, TaskStatus } from "./types";

// 🔐 Auth Imports
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import apiClient from "./api/client";

function LogoutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function Dashboard() {
  const PROJECT_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#6b7280",
  ];
  const DEFAULT_PROJECT_COLOR = "#3b82f6";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<
    "bubbles" | "kanban" | "projects" | "analytics"
  >("bubbles");
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoStartPomodoro, setAutoStartPomodoro] = useState(false); // Por defecto desactivado
  const [showKanbanHealthCheck, setShowKanbanHealthCheck] = useState(false); // Por defecto desactivado
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcutsCenter, setShowShortcutsCenter] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [projectDraft, setProjectDraft] = useState<{
    id?: string;
    name: string;
    color: string;
  }>({
    name: "",
    color: DEFAULT_PROJECT_COLOR,
  });
  const [projectFormError, setProjectFormError] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [kanbanViewMode, setKanbanViewMode] = useState<"kanban" | "calendar">(
    "kanban",
  );
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1); // 0 = Domingo, 1 = Lunes

  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(
    null,
  );
  const [isPlanningNextWeek, setIsPlanningNextWeek] = useState(false);
  const [kanbanPulse, setKanbanPulse] = useState(false);
  const dropZoneHoyRef = useRef<HTMLDivElement>(null);
  const dropZoneLuegoRef = useRef<HTMLDivElement>(null);
  const [snoozeMeta, setSnoozeMeta] = useState<
    Record<string, { count: number; lastPreset: string; updatedAt: string }>
  >(() => {
    try {
      const raw = localStorage.getItem("flow-snooze-meta");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { logout, user } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (view !== "kanban" && selectedTaskIds.length > 0) {
      setSelectedTaskIds([]);
      setLastSelectedTaskId(null);
    }
  }, [view, selectedTaskIds.length]);

  useEffect(() => {
    localStorage.setItem("flow-snooze-meta", JSON.stringify(snoozeMeta));
  }, [snoozeMeta]);

  useEffect(() => {
    if (!kanbanPulse) return;
    const timer = setTimeout(() => setKanbanPulse(false), 900);
    return () => clearTimeout(timer);
  }, [kanbanPulse]);

  const fetchTasks = async () => {
    try {
      const { data } = await apiClient.get("/tasks");
      const tasksData = Array.isArray(data) ? data : data.data || [];
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await apiClient.get("/projects");
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateProjectModal = () => {
    setProjectModalMode("create");
    setProjectDraft({ name: "", color: DEFAULT_PROJECT_COLOR });
    setProjectFormError(null);
    setShowProjectModal(true);
  };

  const openEditProjectModal = (project: Project) => {
    setProjectModalMode("edit");
    setProjectDraft({
      id: project.id,
      name: project.name,
      color: project.color || DEFAULT_PROJECT_COLOR,
    });
    setProjectFormError(null);
    setShowProjectModal(true);
  };

  const handleSaveProject = async () => {
    const trimmedName = projectDraft.name.trim();
    if (!trimmedName) {
      setProjectFormError("El nombre del proyecto es obligatorio.");
      return;
    }

    setIsSavingProject(true);
    setProjectFormError(null);

    try {
      const endpoint =
        projectModalMode === "create"
          ? "/projects"
          : `/projects/${projectDraft.id}`;

      if (projectModalMode === "create") {
        await apiClient.post(endpoint, {
          name: trimmedName,
          color: projectDraft.color,
        });
      } else {
        await apiClient.patch(endpoint, {
          name: trimmedName,
          color: projectDraft.color,
        });
      }

      await fetchProjects();
      setShowProjectModal(false);
    } catch (err: any) {
      setProjectFormError(
        err.response?.data?.message || "No se pudo guardar el proyecto.",
      );
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmProjectDelete = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);

    try {
      await apiClient.delete(`/projects/${projectToDelete.id}`);
      await Promise.all([fetchProjects(), fetchTasks()]);
      setProjectToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleTaskCreated = async (taskData: Partial<Task>) => {
    try {
      await apiClient.post("/tasks", taskData);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskStatusChange = async (id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );

    try {
      await apiClient.patch(`/tasks/${id}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );

    try {
      await apiClient.patch(`/tasks/${id}`, updates);
      fetchTasks();
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleTaskComplete = async (id: string) => {
    handleTaskStatusChange(id, "done");
  };

  const handleTaskDelete = async (id: string) => {
    const targetTask = tasks.find((task) => task.id === id);
    setTaskToDelete({
      id,
      title: targetTask?.title || "esta tarea",
    });
  };

  const confirmTaskDelete = async () => {
    if (!taskToDelete) return;

    setIsDeletingTask(true);
    try {
      await apiClient.delete(`/tasks/${taskToDelete.id}`);
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

  const handleTaskDrop = async (id: string, zone: "hoy" | "luego") => {
    const newStatus = zone === "hoy" ? "todo" : "backlog";
    handleTaskStatusChange(id, newStatus);
    if (zone === "hoy") {
      setKanbanPulse(true);
    }
  };

  const calculateSnoozeDate = (
    preset: "laterToday" | "tomorrow" | "nextMonday",
  ) => {
    const now = new Date();

    if (preset === "laterToday") {
      const laterToday = new Date(now);
      laterToday.setHours(Math.max(now.getHours() + 3, 17), 0, 0, 0);
      return laterToday;
    }

    if (preset === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }

    const nextMonday = new Date(now);
    const day = now.getDay();
    const daysUntilNextMonday = (8 - day) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);
    nextMonday.setHours(9, 0, 0, 0);
    return nextMonday;
  };

  const handleSnoozeTask = async (
    id: string,
    preset: "laterToday" | "tomorrow" | "nextMonday",
  ) => {
    const dueDate = calculateSnoozeDate(preset).toISOString();

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, dueDate: dueDate } : task,
      ),
    );
    setSnoozeMeta((prev) => ({
      ...prev,
      [id]: {
        count: (prev[id]?.count || 0) + 1,
        lastPreset: preset,
        updatedAt: new Date().toISOString(),
      },
    }));

    try {
      await apiClient.patch(`/tasks/${id}`, { dueDate: dueDate });
      await fetchTasks();
    } catch (err) {
      console.error(err);
      await fetchTasks();
    }
  };

  const toggleTaskSelection = (
    id: string,
    shiftKey = false,
    orderedIds: string[] = [],
  ) => {
    setSelectedTaskIds((prev) => {
      if (shiftKey && lastSelectedTaskId && orderedIds.length > 0) {
        const startIndex = orderedIds.indexOf(lastSelectedTaskId);
        const endIndex = orderedIds.indexOf(id);

        if (startIndex !== -1 && endIndex !== -1) {
          const [from, to] =
            startIndex < endIndex
              ? [startIndex, endIndex]
              : [endIndex, startIndex];
          const rangeIds = orderedIds.slice(from, to + 1);
          return Array.from(new Set([...prev, ...rangeIds]));
        }
      }

      return prev.includes(id)
        ? prev.filter((taskId) => taskId !== id)
        : [...prev, id];
    });

    setLastSelectedTaskId(id);
  };

  const toggleColumnSelection = (columnTaskIds: string[]) => {
    if (columnTaskIds.length === 0) return;

    setSelectedTaskIds((prev) => {
      const allSelected = columnTaskIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !columnTaskIds.includes(id));
      }

      return Array.from(new Set([...prev, ...columnTaskIds]));
    });

    setLastSelectedTaskId(columnTaskIds[0]);
  };

  const clearTaskSelection = () => {
    setSelectedTaskIds([]);
    setLastSelectedTaskId(null);
  };

  const bulkUpdateSelected = async (updates: Partial<Task>) => {
    if (selectedTaskIds.length === 0) return;

    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedTaskIds.map((id) => apiClient.patch(`/tasks/${id}`, updates)),
      );
      await fetchTasks();
      clearTaskSelection();
    } catch (err) {
      console.error(err);
      await fetchTasks();
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const bulkDeleteSelected = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkUpdating(true);

    try {
      await Promise.all(
        selectedTaskIds.map((id) => apiClient.delete(`/tasks/${id}`)),
      );
      await fetchTasks();
      clearTaskSelection();
    } catch (err) {
      console.error(err);
      await fetchTasks();
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handlePlanNextWeek = async () => {
    const candidates = tasks
      .filter((t) => t.status === "backlog")
      .sort(
        (a, b) =>
          b.priority - a.priority ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .slice(0, 3);

    if (candidates.length === 0) return;

    const now = new Date();
    const nextMonday = new Date(now);
    const day = now.getDay();
    const daysUntilNextMonday = (8 - day) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);
    nextMonday.setHours(9, 0, 0, 0);

    setIsPlanningNextWeek(true);
    try {
      await Promise.all(
        candidates.map((task) =>
          apiClient.patch(`/tasks/${task.id}`, {
            status: "todo",
            dueDate: task.dueDate || nextMonday.toISOString(),
          }),
        ),
      );
      await fetchTasks();
    } catch (err) {
      console.error(err);
      await fetchTasks();
    } finally {
      setIsPlanningNextWeek(false);
    }
  };

  const findColumnId = (id: string): TaskStatus | undefined => {
    if (["backlog", "todo", "doing", "done"].includes(id))
      return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status;
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
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: overStatus } : t,
        ),
      );
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
  const nowMs = Date.now();
  const weekAhead = new Date(nowMs + 1000 * 60 * 60 * 24 * 7).getTime();
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < nowMs,
  );
  const noDateTasks = tasks.filter(
    (t) => (t.status === "todo" || t.status === "doing") && !t.dueDate,
  );
  const staleTasks = doingTasks.filter((t) => {
    const createdAt = new Date(t.createdAt).getTime();
    if (Number.isNaN(createdAt)) return false;
    return nowMs - createdAt > 1000 * 60 * 60 * 24 * 3;
  });

  const healthItems = [
    {
      key: "doing",
      label: "WIP en Doing",
      value: doingTasks.length,
      threshold: 5,
      okText: "Balanceado",
      warnText: "Sobrecarga",
    },
    {
      key: "overdue",
      label: "Vencidas",
      value: overdueTasks.length,
      threshold: 0,
      okText: "Al día",
      warnText: "Atención",
    },
    {
      key: "nodate",
      label: "Sin fecha",
      value: noDateTasks.length,
      threshold: 2,
      okText: "Priorizado",
      warnText: "Sin claridad",
    },
    {
      key: "stale",
      label: "Bloqueadas +3d",
      value: staleTasks.length,
      threshold: 0,
      okText: "Fluyendo",
      warnText: "Atascado",
    },
  ];

  const projectWorkload = (
    projects.length > 0 ? projects : [{ id: "none", name: "Sin proyecto" }]
  ).map((project) => {
    const scopedTasks = tasks.filter((task) => {
      if (project.id === "none") return !task.projectId;
      return task.projectId === project.id;
    });

    const active = scopedTasks.filter((task) => task.status !== "done").length;
    const dueThisWeek = scopedTasks.filter((task) => {
      if (!task.dueDate || task.status === "done") return false;
      const dueMs = new Date(task.dueDate).getTime();
      return dueMs >= nowMs && dueMs <= weekAhead;
    }).length;
    const overdue = scopedTasks.filter((task) => {
      if (!task.dueDate || task.status === "done") return false;
      return new Date(task.dueDate).getTime() < nowMs;
    }).length;

    const loadLevel = active > 8 ? "high" : active > 4 ? "medium" : "low";

    return {
      id: project.id,
      name: project.name,
      color:
        project.id === "none"
          ? "#6B7280"
          : projects.find((p) => p.id === project.id)?.color || "#3b82f6",
      active,
      dueThisWeek,
      overdue,
      loadLevel,
    };
  });

  const shortcutSections = [
    {
      title: "Captura rápida",
      items: [
        { keys: "Ctrl/Cmd + Espacio", action: "Abrir/cerrar captura" },
        { keys: "Ctrl/Cmd + K", action: "Abrir CommandBar" },
        { keys: "Enter", action: "Crear tarea" },
        { keys: "Esc", action: "Cerrar overlays/modal" },
      ],
    },
    {
      title: "Kanban Pro",
      items: [
        { keys: "Arrastrar y soltar", action: "Mover entre columnas" },
        { keys: "Shift + click", action: "Seleccionar rango en columna" },
        { keys: "Toggle columna", action: "Seleccionar todas de una columna" },
      ],
    },
    {
      title: "Snooze inteligente",
      items: [
        { keys: "Boton reloj", action: "Posponer tarea" },
        { keys: "Esta tarde", action: "Reagenda para hoy tarde" },
        { keys: "Mañana/Lunes", action: "Reagenda a bloque futuro" },
      ],
    },
  ];

  const todayTasks = tasks.filter((t) => t.status === "todo");

  // ── Inicial del usuario para el avatar ──
  const userInitial = (
    user?.name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();
  const userName = user?.name || user?.email?.split("@")[0] || "Usuario";
  const userEmail = user?.email || "";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-flow-bg">
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* Navigation Rail */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:left-4 md:top-1/2 md:-translate-y-1/2 md:-translate-x-0 z-40 flex flex-row md:flex-col gap-1 md:gap-1 p-2 glass rounded-full overflow-x-auto w-[90vw] md:w-auto justify-between md:justify-center no-scrollbar">
        <NavButton
          active={view === "bubbles"}
          onClick={() => setView("bubbles")}
          icon={<Zap />}
          label="Flujo"
        />
        <NavButton
          active={view === "kanban"}
          onClick={() => setView("kanban")}
          icon={<LayoutGrid />}
          label="Tablero"
          highlight={kanbanPulse}
        />
        <NavButton
          active={view === "projects"}
          onClick={() => setView("projects")}
          icon={<List />}
          label="Proyectos"
        />
        <NavButton
          active={view === "analytics"}
          onClick={() => setView("analytics")}
          icon={<BarChart3 />}
          label="Estadísticas"
        />

        <div className="hidden md:block w-6 h-px bg-white/[0.07] mx-auto my-1" />

        <NavButton
          active={showSettings}
          onClick={() => setShowSettings(true)}
          icon={<Settings />}
          label="Ajustes"
        />

        {/* Sesión: avatar + logout — solo desktop */}
        <div className="hidden md:flex flex-col items-center gap-1 pt-1">
          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Avatar */}
          <div className="relative group/avatar">
            <div className="w-9 h-9 rounded-full bg-flow-accent/15 border border-flow-accent/25 flex items-center justify-center cursor-default select-none">
              <span className="text-[12px] font-mono font-bold text-flow-accent">
                {userInitial}
              </span>
            </div>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 z-50">
              <div className="bg-black/90 border border-white/[0.08] rounded-xl px-3 py-2.5 whitespace-nowrap shadow-xl">
                <p className="text-[11px] font-medium text-white/70">
                  {userName}
                </p>
                {userEmail && (
                  <p className="text-[9px] font-mono text-white/30 mt-0.5">
                    {userEmail}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                  <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">
                    Sesión activa
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="relative group/logout">
            <button
              onClick={logout}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/20 hover:text-red-400/80 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all duration-200"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon size={15} />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/logout:opacity-100 transition-all duration-200 z-50">
              <div className="bg-black/90 border border-red-500/20 rounded-xl px-3 py-2 whitespace-nowrap shadow-xl">
                <p className="text-[11px] font-mono text-red-400/80">
                  Cerrar sesión
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout mobile */}
        <button
          onClick={logout}
          className="md:hidden p-3 rounded-full flex items-center justify-center text-white/25 hover:text-red-400/70 hover:bg-red-500/10 transition-all"
          aria-label="Cerrar sesión"
        >
          <LogoutIcon size={18} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative min-h-0 min-w-0 scroll-smooth">
        <AnimatePresence mode="wait">
          {view === "bubbles" && (
            <motion.div
              key="bubbles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full relative overflow-hidden"
            >
              {/* Drop Zones */}
              <div className="absolute top-20 md:top-8 left-1/2 -translate-x-1/2 flex gap-4 md:gap-8 z-10 scale-90 md:scale-100">
                <DropZone
                  ref={dropZoneHoyRef}
                  label="Hoy"
                  color="bg-emerald-500/10"
                />
                <DropZone
                  ref={dropZoneLuegoRef}
                  label="Luego"
                  color="bg-amber-500/10"
                />
              </div>

              {tasks
                .filter((t) => t.status !== "done")
                .map((task) => (
                  <TaskBubble
                    key={task.id}
                    task={task}
                    onFocus={setFocusedTask}
                    onComplete={handleTaskComplete}
                    onDelete={handleTaskDelete}
                    onDrop={handleTaskDrop}
                    dropZoneHoyRef={dropZoneHoyRef}
                    dropZoneLuegoRef={dropZoneLuegoRef}
                  />
                ))}

              {tasks.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-white/20">
                  <p className="text-xl font-display">
                    Presiona Ctrl + Espacio para empezar
                  </p>
                </div>
              )}

              {/* Cajón de Hoy / Mi Día */}
              <AnimatePresence>
                {todayTasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.97 }}
                    className="fixed bottom-24 md:bottom-[4.5rem] right-4 md:right-8 z-30 glass rounded-2xl px-4 py-3 w-[calc(100vw-2rem)] md:w-80 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-flow-accent shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-white/60">
                          Mi Día
                        </p>
                      </div>
                      <button
                        onClick={() => setView("kanban")}
                        className="text-[10px] font-mono uppercase tracking-widest text-flow-accent hover:text-white/90 bg-flow-accent/10 hover:bg-flow-accent/20 px-2 py-0.5 rounded-full transition-colors"
                      >
                        Ver Tablero
                      </button>
                    </div>
                    <p className="text-[11px] text-white/40 mb-2">
                      {todayTasks.length}{" "}
                      {todayTasks.length === 1
                        ? "tarea en Hoy"
                        : "tareas en Hoy"}{" "}
                      (se ven también en el tablero)
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                      {todayTasks.slice(0, 4).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setFocusedTask(task)}
                          className="w-full text-left px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all group flex items-center justify-between gap-2"
                        >
                          <span className="text-[11px] text-white/80 truncate group-hover:text-flow-accent">
                            {task.title}
                          </span>
                          {task.priority === 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
                              P3
                            </span>
                          )}
                        </button>
                      ))}
                      {todayTasks.length > 4 && (
                        <p className="text-[10px] text-white/35 px-1">
                          +{todayTasks.length - 4} más para hoy
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === "kanban" && (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <AnimatePresence>
                {selectedTaskIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-4 py-3 flex items-center gap-2 max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
                  >
                    <div className="flex items-center gap-2 pr-2 mr-2 border-r border-white/10">
                      <CheckSquare className="w-4 h-4 text-flow-accent" />
                      <span className="text-xs font-medium text-white/70">
                        {selectedTaskIds.length} seleccionadas
                      </span>
                    </div>

                    <button
                      disabled={isBulkUpdating}
                      onClick={() => bulkUpdateSelected({ status: "todo" })}
                      className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-white/70 disabled:opacity-40"
                    >
                      A Hoy
                    </button>
                    <button
                      disabled={isBulkUpdating}
                      onClick={() => bulkUpdateSelected({ status: "doing" })}
                      className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-white/70 disabled:opacity-40"
                    >
                      En Proceso
                    </button>
                    <button
                      disabled={isBulkUpdating}
                      onClick={() =>
                        bulkUpdateSelected({
                          status: "done",
                          completedAt: new Date().toISOString(),
                        })
                      }
                      className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] text-emerald-300 disabled:opacity-40"
                    >
                      Archivar
                    </button>

                    <button
                      disabled={isBulkUpdating}
                      onClick={() => bulkUpdateSelected({ priority: 3 })}
                      className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 disabled:opacity-40"
                    >
                      Prioridad Alta
                    </button>
                    <button
                      disabled={isBulkUpdating}
                      onClick={() =>
                        bulkUpdateSelected({
                          dueDate: new Date(
                            Date.now() + 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        })
                      }
                      className="px-2.5 py-1 rounded-md bg-flow-accent/20 hover:bg-flow-accent/30 text-[11px] text-blue-300 disabled:opacity-40"
                    >
                      Vence Mañana
                    </button>

                    <button
                      disabled={isBulkUpdating}
                      onClick={bulkDeleteSelected}
                      className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/35 text-[11px] text-red-300 disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                    <button
                      disabled={isBulkUpdating}
                      onClick={clearTaskSelection}
                      className="p-1.5 rounded-md hover:bg-white/10 text-white/50 disabled:opacity-40"
                      title="Limpiar selección"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {showKanbanHealthCheck && (
                <div className="hidden md:block fixed top-6 right-8 z-40 w-64 glass rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                      Health Check
                    </p>
                    <span className="text-[10px] text-flow-accent/80">
                      Tablero
                    </span>
                  </div>
                  {healthItems.map((item) => {
                    const isHealthy = item.value <= item.threshold;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-b-0"
                      >
                        <span className="text-white/55">{item.label}</span>
                        <span
                          className={
                            isHealthy ? "text-emerald-300" : "text-amber-300"
                          }
                        >
                          {item.value} ·{" "}
                          {isHealthy ? item.okText : item.warnText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <motion.div
                key="kanban-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="h-full flex flex-col gap-6 md:pl-24 pt-24 md:pt-8 pr-6 pb-32 md:pb-14"
              >
                {/* Kanban Header with View Switcher */}
                <div className="flex items-center justify-between px-6 md:px-0">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-display font-bold text-white/90">
                      Gestión de Flujo
                    </h2>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
                      Tablero & Temporalidad
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] p-1 rounded-xl">
                    <button
                      onClick={() => setKanbanViewMode("kanban")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${kanbanViewMode === "kanban" ? "bg-flow-accent/20 text-flow-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "text-white/30 hover:text-white/60"}`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Tablero
                    </button>
                    <button
                      onClick={() => setKanbanViewMode("calendar")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${kanbanViewMode === "calendar" ? "bg-flow-accent/20 text-flow-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "text-white/30 hover:text-white/60"}`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Calendario
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {kanbanViewMode === "kanban" ? (
                    <motion.div
                      key="kanban-grid"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-4"
                    >
                      <KanbanColumn
                        id="backlog"
                        title="Pendientes"
                        subtitle="Luego"
                        color="#6B7280"
                        tasks={tasks.filter((t) => t.status === "backlog")}
                        onTaskClick={setFocusedTask}
                        onDelete={handleTaskDelete}
                        projects={projects}
                        isOver={overColumnId === "backlog"}
                        isDragging={!!activeId}
                        selectedTaskIds={selectedTaskIds}
                        onToggleTaskSelect={toggleTaskSelection}
                        onToggleColumnSelect={toggleColumnSelection}
                        onSnoozeTask={handleSnoozeTask}
                        snoozeMeta={snoozeMeta}
                      />
                      <KanbanColumn
                        id="todo"
                        title="Por Hacer"
                        subtitle="Hoy"
                        color="#3B82F6"
                        tasks={tasks.filter((t) => t.status === "todo")}
                        onTaskClick={setFocusedTask}
                        onDelete={handleTaskDelete}
                        projects={projects}
                        isOver={overColumnId === "todo"}
                        isDragging={!!activeId}
                        selectedTaskIds={selectedTaskIds}
                        onToggleTaskSelect={toggleTaskSelection}
                        onToggleColumnSelect={toggleColumnSelection}
                        onSnoozeTask={handleSnoozeTask}
                        snoozeMeta={snoozeMeta}
                      />
                      <KanbanColumn
                        id="doing"
                        title="En Proceso"
                        color="#F59E0B"
                        tasks={tasks.filter((t) => t.status === "doing")}
                        onTaskClick={setFocusedTask}
                        onDelete={handleTaskDelete}
                        projects={projects}
                        isOver={overColumnId === "doing"}
                        isDragging={!!activeId}
                        selectedTaskIds={selectedTaskIds}
                        onToggleTaskSelect={toggleTaskSelection}
                        onToggleColumnSelect={toggleColumnSelection}
                        onSnoozeTask={handleSnoozeTask}
                        snoozeMeta={snoozeMeta}
                      />
                      <KanbanColumn
                        id="done"
                        title="Hecho"
                        color="#10B981"
                        tasks={tasks.filter((t) => t.status === "done")}
                        onTaskClick={setFocusedTask}
                        onDelete={handleTaskDelete}
                        projects={projects}
                        isOver={overColumnId === "done"}
                        isDragging={!!activeId}
                        selectedTaskIds={selectedTaskIds}
                        onToggleTaskSelect={toggleTaskSelection}
                        onToggleColumnSelect={toggleColumnSelection}
                        onSnoozeTask={handleSnoozeTask}
                        snoozeMeta={snoozeMeta}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="calendar-view"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 pb-4"
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
              </motion.div>

              <DragOverlay
                dropAnimation={{
                  duration: 200,
                  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: "0.4",
                      },
                    },
                  }),
                }}
              >
                {activeTask ? (
                  <div className="w-72 rotate-1 scale-[1.02] shadow-2xl shadow-black/50">
                    <KanbanCard
                      task={activeTask}
                      onClick={() => {}}
                      projects={projects}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {view === "projects" && (
            <ProjectView
              tasks={tasks}
              projects={projects}
              projectWorkload={projectWorkload}
              openCreateProjectModal={openCreateProjectModal}
              openEditProjectModal={openEditProjectModal}
              handleDeleteProject={handleDeleteProject}
              setFocusedTask={setFocusedTask}
              weekStartsOn={weekStartsOn}
            />
          )}

          {view === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full w-full"
            >
              <AnalyticsView
                tasks={tasks}
                onPlanNextWeek={handlePlanNextWeek}
                isPlanningNextWeek={isPlanningNextWeek}
              />
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
              className="w-full max-w-md glass rounded-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold">
                  Ajustes de Flujo
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/5 rounded-full"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Auto-inicio de Pomodoro
                    </p>
                    <p className="text-xs text-white/40">
                      Iniciar el tiempo al abrir una tarea
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoStartPomodoro(!autoStartPomodoro)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${autoStartPomodoro ? "bg-flow-accent" : "bg-white/10"}`}
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
                    <p className="text-xs text-white/40">
                      Día en que comienza la semana en el calendario
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeekStartsOn(1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        weekStartsOn === 1
                          ? "bg-flow-accent text-white"
                          : "bg-white/5 text-white/40 hover:text-white/70"
                      }`}
                    >
                      Lunes
                    </button>
                    <button
                      onClick={() => setWeekStartsOn(0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        weekStartsOn === 0
                          ? "bg-flow-accent text-white"
                          : "bg-white/5 text-white/40 hover:text-white/70"
                      }`}
                    >
                      Domingo
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Panel Health Check en Kanban
                    </p>
                    <p className="text-xs text-white/40">
                      Muestra el panel fijo de métricas operativas en el tablero
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setShowKanbanHealthCheck(!showKanbanHealthCheck)
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${showKanbanHealthCheck ? "bg-flow-accent" : "bg-white/10"}`}
                  >
                    <motion.div
                      animate={{ x: showKanbanHealthCheck ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                <button
                  onClick={() => setShowShortcutsCenter(true)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-flow-accent/20 text-flow-accent flex items-center justify-center">
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        Centro de Atajos y Comandos
                      </p>
                      <p className="text-xs text-white/40">
                        Guía rápida para dominar el flujo
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-white/35">Abrir</span>
                </button>
              </div>

              {/* Card de sesión */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-flow-accent/15 border border-flow-accent/25 flex items-center justify-center">
                    <span className="text-[11px] font-mono font-bold text-flow-accent">
                      {userInitial}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      {userName}
                    </p>
                    {userEmail && (
                      <p className="text-[10px] text-white/30 font-mono">
                        {userEmail}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 text-[11px] font-mono transition-all border border-red-500/15"
                >
                  <LogoutIcon size={12} />
                  Salir
                </button>
              </div>

              <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">
                The Flow OS v1.0
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isSavingProject && setShowProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold">
                  {projectModalMode === "create"
                    ? "Nuevo Proyecto"
                    : "Editar Proyecto"}
                </h2>
                <button
                  onClick={() => setShowProjectModal(false)}
                  disabled={isSavingProject}
                  className="p-2 hover:bg-white/5 rounded-full disabled:opacity-40"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs text-white/45 uppercase tracking-widest">
                  Nombre
                </label>
                <input
                  value={projectDraft.name}
                  onChange={(e) =>
                    setProjectDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ej. Marketing Q2"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-flow-accent text-sm"
                  maxLength={60}
                  disabled={isSavingProject}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs text-white/45 uppercase tracking-widest">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setProjectDraft((prev) => ({ ...prev, color }))
                      }
                      disabled={isSavingProject}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        projectDraft.color === color
                          ? "border-white scale-110"
                          : "border-white/20 hover:border-white/60"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">
                  Vista previa
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: projectDraft.color }}
                  />
                  <p className="text-sm text-white/85">
                    {projectDraft.name.trim() || "Nombre del proyecto"}
                  </p>
                </div>
              </div>

              {projectFormError && (
                <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {projectFormError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowProjectModal(false)}
                  disabled={isSavingProject}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={isSavingProject}
                  className="px-3 py-2 rounded-lg bg-flow-accent hover:brightness-110 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {isSavingProject
                    ? "Guardando..."
                    : projectModalMode === "create"
                      ? "Crear proyecto"
                      : "Guardar cambios"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[66] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isDeletingProject && setProjectToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-display font-semibold">
                  Eliminar proyecto
                </h2>
                <p className="text-sm text-white/50">
                  Se eliminará el proyecto y sus tareas quedarán sin proyecto
                  asignado.
                </p>
                <p className="text-sm text-white/85">
                  <span className="text-white/45">Proyecto:</span>{" "}
                  {projectToDelete.name}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setProjectToDelete(null)}
                  disabled={isDeletingProject}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmProjectDelete}
                  disabled={isDeletingProject}
                  className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {isDeletingProject ? "Eliminando..." : "Eliminar proyecto"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Center */}
      <AnimatePresence>
        {showShortcutsCenter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowShortcutsCenter(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl glass rounded-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-display font-semibold">
                    Centro de Atajos y Comandos
                  </h2>
                  <p className="text-xs text-white/40">
                    Referencia rápida para moverte más rápido en Flow OS
                  </p>
                </div>
                <button
                  onClick={() => setShowShortcutsCenter(false)}
                  className="p-2 hover:bg-white/5 rounded-full"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shortcutSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-xl bg-white/5 p-4 space-y-3"
                  >
                    <h3 className="text-sm font-mono uppercase tracking-widest text-flow-accent/70">
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div
                          key={`${section.title}-${item.keys}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-white/75 font-mono">
                            {item.keys}
                          </span>
                          <span className="text-xs text-white/55 text-right leading-relaxed">
                            {item.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                  <h2 className="text-lg font-display font-semibold">
                    Confirmar eliminación
                  </h2>
                  <p className="text-sm text-white/50">
                    Esta acción eliminará permanentemente la tarea.
                  </p>
                  <p className="text-sm text-white/80 break-words">
                    <span className="text-white/40">Tarea:</span>{" "}
                    {taskToDelete.title}
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
                  {isDeletingTask ? "Eliminando..." : "Si, eliminar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlays */}
      <CommandBar onTaskCreated={handleTaskCreated} projects={projects} />
      <FocusMode
        task={focusedTask}
        projects={projects}
        onClose={() => setFocusedTask(null)}
        onComplete={handleTaskComplete}
        onUpdate={handleUpdateTask}
        autoStart={autoStartPomodoro}
      />

      {/* Keyboard Hint */}
      {/* <div className="hidden md:flex fixed bottom-6 right-8 text-white/20 text-xs font-mono items-center gap-2 z-20">
        <span className="px-1.5 py-0.5 rounded border border-white/10">
          CTRL
        </span>
        <span>+</span>
        <span className="px-1.5 py-0.5 rounded border border-white/10">
          ESPACIO
        </span>
        <span className="ml-2">o</span>
        <span className="px-1.5 py-0.5 rounded border border-white/10">
          K
        </span>
        <span className="ml-2">para capturar</span>
      </div> */}
      <motion.div
        className="hidden md:flex fixed bottom-6 right-8 items-center gap-1.5 z-20
             px-3 py-1.5 rounded-full
             bg-black/50 backdrop-blur-md
             border border-white/[0.06]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5, ease: "easeOut" }}
      >
        {[
          { type: "key", label: "CTRL" },
          { type: "sep", label: "+" },
          { type: "key", label: "ESPACIO" },
          { type: "sep", label: "o" },
          { type: "key", label: "K" },
        ].map((item, i) =>
          item.type === "sep" ? (
            <span key={i} className="text-white/20 text-xs font-mono px-0.5">
              {item.label}
            </span>
          ) : (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded border border-white/[0.10] bg-white/[0.06]
                   text-white/30 text-xs font-mono
                   shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              {item.label}
            </span>
          ),
        )}
        <span className="ml-1 text-white/20 text-xs font-mono">
          para capturar
        </span>
      </motion.div>
    </div>
  );
}

// 🌐 Auth Entry Point
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-flow-bg">
        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === "login" ? (
      <LoginPage onSwitchAction={() => setAuthMode("register")} />
    ) : (
      <RegisterPage onSwitchAction={() => setAuthMode("login")} />
    );
  }

  return <Dashboard />;
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  highlight = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all relative group ${
        active
          ? "bg-flow-accent text-white"
          : "text-white/40 hover:text-white hover:bg-white/5"
      } ${
        highlight && !active
          ? "ring-2 ring-flow-accent/80 shadow-[0_0_22px_rgba(59,130,246,0.75)]"
          : ""
      }`}
    >
      <motion.div
        animate={
          highlight && !active
            ? { scale: [1, 1.08, 1], rotate: [0, -4, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.6 }}
      >
        {icon}
      </motion.div>
      <span className="absolute left-full ml-4 px-2 py-1 rounded bg-white text-black text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

const DropZone = React.forwardRef<
  HTMLDivElement,
  { label: string; color: string }
>(({ label, color }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-10 py-6 rounded-2xl border-2 border-dashed border-white/10 ${color} flex flex-col items-center justify-center min-w-[180px] backdrop-blur-sm transition-all hover:border-white/20`}
    >
      <span className="text-[10px] opacity-30 uppercase tracking-widest mb-1">
        Arrastra aquí
      </span>
      <span className="text-sm font-bold uppercase tracking-widest text-white/60">
        {label}
      </span>
    </div>
  );
});

function KanbanColumn({
  id,
  title,
  subtitle,
  color,
  tasks,
  onTaskClick,
  onDelete,
  projects,
  isOver,
  isDragging,
  selectedTaskIds,
  onToggleTaskSelect,
  onToggleColumnSelect,
  onSnoozeTask,
  snoozeMeta,
}: {
  id: string;
  title: string;
  subtitle?: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDelete: (id: string) => void;
  projects: Project[];
  isOver?: boolean;
  isDragging?: boolean;
  selectedTaskIds: string[];
  onToggleTaskSelect: (
    id: string,
    shiftKey: boolean,
    orderedIds: string[],
  ) => void;
  onToggleColumnSelect: (columnTaskIds: string[]) => void;
  onSnoozeTask: (
    id: string,
    preset: "laterToday" | "tomorrow" | "nextMonday",
  ) => void;
  snoozeMeta: Record<
    string,
    { count: number; lastPreset: string; updatedAt: string }
  >;
}) {
  const { setNodeRef, isOver: isDirectlyOver } = useDroppable({ id });
  const highlighted = isOver || isDirectlyOver;
  const taskIds = tasks.map((t) => t.id);
  const selectedCount = taskIds.filter((taskId) =>
    selectedTaskIds.includes(taskId),
  ).length;
  const allSelected = taskIds.length > 0 && selectedCount === taskIds.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "backlog":
        return <Clock className="w-3.5 h-3.5 text-white/40" />;
      case "todo":
        return <Zap className="w-3.5 h-3.5 text-flow-accent" />;
      case "doing":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
          </motion.div>
        );
      case "done":
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors duration-200 ${
        highlighted && isDragging ? "bg-white/[0.03]" : ""
      }`}
    >
      {/* Column header - Notion style */}
      <div className="flex items-center gap-2 px-2 pb-3 mb-1">
        <div
          className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-transform duration-200 ${
            highlighted && isDragging ? "scale-125" : ""
          }`}
          style={{ backgroundColor: color }}
        />
        {getStatusIcon(id)}
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        {subtitle && (
          <span className="text-[10px] text-white/25 font-normal">
            {subtitle}
          </span>
        )}
        <button
          onClick={() => onToggleColumnSelect(taskIds)}
          className={`p-1 rounded-md transition-all ${
            allSelected
              ? "text-flow-accent bg-flow-accent/10"
              : "text-white/25 hover:text-white/60 hover:bg-white/5"
          }`}
          title={allSelected ? "Deseleccionar columna" : "Seleccionar columna"}
        >
          {allSelected ? (
            <CheckSquare className="w-3.5 h-3.5" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
        </button>
        {selectedCount > 0 && (
          <span className="text-[10px] text-flow-accent/80">
            {selectedCount}
          </span>
        )}
        <span
          className={`text-[11px] font-mono ml-auto transition-colors duration-200 ${
            highlighted && isDragging ? "text-white/50" : "text-white/25"
          }`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[500px] pb-20 px-1 rounded-lg transition-all duration-200 ${
          highlighted && isDragging
            ? "ring-1 ring-white/10 bg-white/[0.02]"
            : isDragging
              ? "ring-1 ring-transparent"
              : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onDelete={onDelete}
              projects={projects}
              selected={selectedTaskIds.includes(task.id)}
              onToggleSelect={(id, shiftKey) =>
                onToggleTaskSelect(id, shiftKey, taskIds)
              }
              onSnooze={onSnoozeTask}
              snoozeCount={snoozeMeta[task.id]?.count || 0}
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
          <div
            className={`flex items-center justify-center py-10 rounded-lg border border-dashed transition-all duration-200 ${
              highlighted ? "border-white/20 bg-white/[0.03]" : "border-white/5"
            }`}
          >
            <p
              className={`text-[11px] transition-colors duration-200 ${
                highlighted ? "text-white/40" : "text-white/10"
              }`}
            >
              Soltar aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
