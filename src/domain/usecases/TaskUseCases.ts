import { Task, CreateTaskDTO, Session } from '../entities';
import { ITaskRepository } from '../../data/repositories';

export class TaskUseCases {
  constructor(private taskRepo: ITaskRepository) {}

  getTasksByProject(projectId: number): Task[] {
    return this.taskRepo.findByProjectId(projectId);
  }

  createTask(data: CreateTaskDTO): number {
    return this.taskRepo.create(data);
  }

  getRecentSessions(projectId: number, limit: number = 20): Session[] {
    return this.taskRepo.getRecentSessions(projectId, limit);
  }
}
