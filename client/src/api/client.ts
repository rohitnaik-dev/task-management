
import axios from "axios";
import { disconnectSocket } from "../socket/socket";

const configuredUrl = import.meta.env.VITE_API_URL;

if (!configuredUrl) {
  throw new Error("VITE_API_URL is not configured.");
}

const normalizedUrl = configuredUrl.replace(/\/+$/, "");

const apiBaseURL = normalizedUrl.endsWith("/api")
  ? normalizedUrl
  : `${normalizedUrl}/api`;

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isLoginRequest = requestUrl.includes("/auth/login");

      if (!isLoginRequest) {
        disconnectSocket();
        localStorage.removeItem("auth_token");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

