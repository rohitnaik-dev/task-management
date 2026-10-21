import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import type { LoginCredentials, RegisterCredentials, SafeUser } from "../types/auth";
import { AuthContext } from "./useAuth";
import { connectSocket, disconnectSocket } from "../socket/socket";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!localStorage.getItem("auth_token")) {
        if (active) setLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        authApi.logout();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Manage socket connection lifecycle with authentication state
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authApi.login(credentials);
    setUser(result.user);
    connectSocket();
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const result = await authApi.register(credentials);
    setUser(result.user);
    connectSocket();
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}