import { Task, CreateTaskDTO, Session } from '../entities';
import { ITaskRepository } from '../../data/repositories';

export class TaskUseCases {
  constructor(private taskRepo: ITaskRepository) {}

  getTasksByProject(projectId: number): Task[] {
    if (projectId <= 0) return [];
    return this.taskRepo.findByProjectId(projectId);
  }

  createTask(data: CreateTaskDTO): number {
    if (data.projectId <= 0 || !data.taskType?.trim()) return -1;
    return this.taskRepo.create(data);
  }

  getRecentSessions(projectId: number, limit: number = 20): Session[] {
    if (projectId <= 0) return [];
    return this.taskRepo.getRecentSessions(projectId, limit);
  }
}
