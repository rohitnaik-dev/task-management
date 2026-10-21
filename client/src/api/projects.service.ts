import { api } from "./client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by?: string;
  created_at: string;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
}

export async function getProjects(): Promise<Project[]> {
  const response = await api.get<ProjectsResponse>("/projects");
  return response.data.projects;
}

export async function getProjectById(projectId: string): Promise<Project> {
  const response = await api.get<ProjectResponse>(
    `/projects/${encodeURIComponent(projectId)}`,
  );
  return response.data.project;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const response = await api.post<ProjectResponse>("/projects", input);
  return response.data.project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const response = await api.patch<ProjectResponse>(
    `/projects/${encodeURIComponent(projectId)}`,
    input,
  );
  return response.data.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${encodeURIComponent(projectId)}`);
}
