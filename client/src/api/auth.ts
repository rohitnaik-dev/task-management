
import axios from "axios";
import { api } from "./client";
import type {
  AuthResponse,
  LoginCredentials,
  SafeUser,
} from "../types/auth";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }

    if (!error.response) {
      return "Unable to connect to the server. Check your API URL.";
    }

    return "Authentication failed. Please try again.";
  }

  return "An unexpected error occurred.";
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    const { user, token } = response.data;

    if (!user || !token) {
      throw new Error("Invalid authentication response from server.");
    }

    if (user.role !== "admin" && user.role !== "user") {
      throw new Error("The server returned an unsupported user role.");
    }

    localStorage.setItem("auth_token", token);

    return { user, token };
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
}

export async function getCurrentUser(): Promise<SafeUser> {
  try {
    const response = await api.get<{ user: SafeUser }>("/auth/me");
    const user = response.data?.user;

    if (
      !user ||
      typeof user.id !== "string" ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      (user.role !== "admin" && user.role !== "user")
    ) {
      throw new Error("Invalid current-user response from server.");
    }

    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid current-user response from server."
    ) {
      throw error;
    }

    throw new Error(getErrorMessage(error), { cause: error });
  }
}

export function logout(): void {
  localStorage.removeItem("auth_token");
}
