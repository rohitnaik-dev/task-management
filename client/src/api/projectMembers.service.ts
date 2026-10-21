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

interface ProjectMemberResponse {
  member: ProjectMember;
}

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMember[]> {
  const response = await api.get<ProjectMembersResponse>(
    `/projects/${encodeURIComponent(projectId)}/members`,
  );

  return response.data.members;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectMember> {
  const response = await api.post<ProjectMemberResponse>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    { userId },
  );

  return response.data.member;
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await api.delete(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
  );
}
