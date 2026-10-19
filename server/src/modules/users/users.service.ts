import { pool } from "../../db/pool.js";

export interface SafeUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export async function getAllUsers(): Promise<SafeUser[]> {
    const result = await pool.query<SafeUser>(
        `SELECT id, email, name, role
        FROM users
        ORDER BY id ASC`
    );

    return result.rows;
    
}

export async function updateUserRole(id: string, role: "user" | "admin",) : Promise<Pick<SafeUser, "id" | "role"> | null> {
    const result = await pool.query<Pick<SafeUser, "id" | "role">>(
        `UPDATE users
        SET role = $2
        WHERE id = $1
        RETURNING id, role`,
        [id, role],
    );

    return result.rows[0] ?? null;
    
}