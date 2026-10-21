
import { api } from "./client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface ProjectsResponse {
  projects: Project[];
}

export async function getProjects(): Promise<Project[]> {
  const response = await api.get<ProjectsResponse>("/projects");
  return response.data.projects;
}
