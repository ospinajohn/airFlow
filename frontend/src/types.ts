export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';

export interface Project {
  id: string;
  name: string;
  color?: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number; // 1: Low, 2: Medium, 3: High
  dueDate?: string;
  projectId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface NLPResult {
  title: string;
  dueDate?: string;
  priority?: number;
  projectName?: string;
}
