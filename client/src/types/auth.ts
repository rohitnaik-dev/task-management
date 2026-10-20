export type UserRole = "admin" | "user";

export interface SafeUser {
    id: string;
    name: string;
    email: string;
    role: UserRole
}

export interface AuthResponse {
    user: SafeUser;
    token: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}