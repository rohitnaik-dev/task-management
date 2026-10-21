
import { api } from "./client";

export type TaskStatus = "Pending" | "In Progress" | "Completed";

export interface TaskAssignee {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedTo: string | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee: TaskAssignee | null;
}

interface TasksResponse {
  tasks: Task[];
}

interface TaskResponse {
  task: Task;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignedTo?: string | null;
}

export async function getProjectTasks(
  projectId: string,
): Promise<Task[]> {
  const response = await api.get<TasksResponse>(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
  );

  return response.data.tasks;
}

export async function createProjectTask(
  projectId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const response = await api.post<TaskResponse>(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
    input,
  );

  return response.data.task;
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const response = await api.patch<TaskResponse>(
    `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    input,
  );

  return response.data.task;
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string,
): Promise<void> {
  await api.delete(
    `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
  );
}

export async function reorderProjectTasks(
  projectId: string,
  taskIds: string[],
): Promise<Task[]> {
  const response = await api.patch<TasksResponse>(
    `/projects/${encodeURIComponent(projectId)}/tasks/reorder`,
    { taskIds },
  );

  return response.data.tasks;
}
