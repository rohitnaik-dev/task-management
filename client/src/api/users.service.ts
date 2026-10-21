import { api } from "./client";
import type { SafeUser, UserRole } from "../types/auth";

interface UsersResponse {
  users: SafeUser[];
}

interface UpdateUserRoleResponse {
  message: string;
  user: {
    id: string;
    role: UserRole;
  };
}

export async function getUsers(): Promise<SafeUser[]> {
  const response = await api.get<UsersResponse>("/users");
  return response.data.users;
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<{ id: string; role: UserRole }> {
  const response = await api.patch<UpdateUserRoleResponse>(
    `/users/${encodeURIComponent(userId)}/role`,
    { role },
  );
  return response.data.user;
}
