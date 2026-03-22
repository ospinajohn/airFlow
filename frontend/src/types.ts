export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';

export interface Project {
  id: string;
  name: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number; // 1: Low, 2: Medium, 3: High
  due_date?: string;
  project_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface NLPResult {
  title: string;
  due_date?: string;
  priority?: number;
  project_name?: string;
}
