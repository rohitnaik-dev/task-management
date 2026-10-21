import { api } from "./client";
import type { SafeUser } from "../types/auth";

interface UsersResponse {
  users: SafeUser[];
}

export async function getUsers(): Promise<SafeUser[]> {
  const response = await api.get<UsersResponse>("/users");
  return response.data.users;
}
