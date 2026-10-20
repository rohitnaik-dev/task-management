
import axios from "axios";

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

// Attach the token to requests that require authentication.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
