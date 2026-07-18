export interface Project {
  id: number;
  name: string;
  description?: string;
  memory?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  task_type: string;
  context?: string;
  output?: string;
  created_at: string;
}

export interface Screenshot {
  id: number;
  task_id: number;
  image_data: string;
  analysis_result?: string;
  created_at: string;
}

export interface ConversationMessage {
  id: number;
  project_id: number;
  role: 'user' | 'assistant';
  content: string;
  task_type?: string;
  created_at: string;
}

export type TabType = 'new' | 'history';

export type { Database, Statement } from 'sql.js';
export * from './memory';
