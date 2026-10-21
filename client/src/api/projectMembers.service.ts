
import { api } from "./client";

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  joined_at: string;
}

interface ProjectMembersResponse {
  members: ProjectMember[];
}

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMember[]> {
  const response = await api.get<ProjectMembersResponse>(
    `/projects/${encodeURIComponent(projectId)}/members`,
  );

  return response.data.members;
}
