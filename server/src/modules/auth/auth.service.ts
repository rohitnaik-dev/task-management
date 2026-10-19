import bcrypt from "bcryptjs";
import jwt, {type SignOptions } from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db/pool.js";

import type {
    LoginInput,
    RegisterInput,
} from './auth.schemas.js';

export type UserRole = "user" | "admin";

export interface SafeUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface AuthResult {
    user: SafeUser;
    token: string;
}

export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number,
    ) {
        super(message);
        this.name = "AuthError";
    }
}

interface UserRow {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
}

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if(!secret || secret.length < 32) {
        throw new Error(
            "JWT_SECRET must be configured with at least 32 characters", 
        );
    }

    return secret;
}

function toSafeUser(user: UserRow) :SafeUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

function issueToken(userId: string): string {
    const expiresIn = 
        (process.env.JWT_EXPIRES_IN || "1h") as SignOptions["expiresIn"];

    return jwt.sign({}, getJwtSecret(), {
        subject: userId,
        expiresIn,
        algorithm: "HS256",

    });
}

export function verifyAccessToken(token: string): string {
    const decoded = jwt.verify(token, getJwtSecret(), {
        algorithms: ["HS256"],
    });

    if (
        typeof decoded === "string" ||
        typeof decoded.sub !== "string"
    ) {
        throw new AuthError("Invalid or expired token", 401);
    }

    return decoded.sub;
}


export async function findUserById(userId:string) : Promise<SafeUser | null> {
    const result = await pool.query<SafeUser>(
        `SELECT id, name, email, role
        FROM users
        WHERE id = $1`,
        [userId], 
    );

    return result.rows[0] ?? null;
}

export async function registerUser(input: RegisterInput,): Promise<AuthResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    const passwordHash = await bcrypt.hash(input.password, 12);

    try{
        const result = await pool.query<UserRow>(
            `INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'user')
            RETURNING id, name, email, password_hash, role `,
            [name, email, passwordHash],
        );

        const user = result.rows[0];

        return {
            user: toSafeUser(user),
            token: issueToken(user.id),
        };
    } catch (error: unknown) {
        if( 
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        ) {
            throw new AuthError("Email is already registered", 409)
        }

        throw error;
    } 
}

export async function loginUser(
    input: LoginInput,
) : Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    const result = await pool.query<UserRow>(
        `SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = $1`,
        [email],
    );
    
    const user = result.rows[0];

    if(!user) {
        throw new AuthError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.password_hash,
    );

    if(!passwordMatches) {
        throw new AuthError("Invalid email or password", 401);
    }

    return {
        user: toSafeUser(user),
        token: issueToken(user.id),
    };
}