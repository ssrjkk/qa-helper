import { Project, CreateProjectDTO, UpdateProjectDTO } from '../entities';
import { IProjectRepository } from '../../data/repositories';

export class ProjectUseCases {
  constructor(private projectRepo: IProjectRepository) {}

  getAllProjects(): Project[] {
    return this.projectRepo.findAll();
  }

  getProjectById(id: number): Project | undefined {
    if (id <= 0) return undefined;
    return this.projectRepo.findById(id);
  }

  createProject(data: CreateProjectDTO): number {
    if (!data.name?.trim()) return -1;
    return this.projectRepo.create({ ...data, name: data.name.trim() });
  }

  updateProject(id: number, data: UpdateProjectDTO): void {
    if (id <= 0) return;
    this.projectRepo.update(id, data);
  }

  deleteProject(id: number): void {
    if (id <= 0) return;
    this.projectRepo.delete(id);
  }

  updateProjectMemory(id: number, memory: string): void {
    if (id <= 0) return;
    this.projectRepo.update(id, { memory });
  }
}
