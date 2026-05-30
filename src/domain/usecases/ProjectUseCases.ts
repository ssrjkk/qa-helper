import { Project, CreateProjectDTO, UpdateProjectDTO } from '../entities';
import { IProjectRepository } from '../../data/repositories';

export class ProjectUseCases {
  constructor(private projectRepo: IProjectRepository) {}

  getAllProjects(): Project[] {
    return this.projectRepo.findAll();
  }

  getProjectById(id: number): Project | undefined {
    return this.projectRepo.findById(id);
  }

  createProject(data: CreateProjectDTO): number {
    return this.projectRepo.create(data);
  }

  updateProject(id: number, data: UpdateProjectDTO): void {
    this.projectRepo.update(id, data);
  }

  deleteProject(id: number): void {
    this.projectRepo.delete(id);
  }

  updateProjectMemory(id: number, memory: string): void {
    this.projectRepo.update(id, { memory });
  }
}
