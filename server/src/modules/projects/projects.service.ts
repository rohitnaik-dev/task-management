import { pool} from "../../db/pool.js"
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas.js"

type AuthUser = {
    id: string,
    role: "admin" | "user";
};

export async function createProject(
    user: AuthUser,
    input: CreateProjectInput
) {
    const client = await pool.connect();

    try{
        await client.query("BEGIN");

        const projectResult = await client.query(
            `INSERT INTO projects (name, description, created_by)
            VALUES ($1, $2, $3)
            RETURNING id, name, description, created_at`,
            [
                input.name,
                input.description ?? null,
                user.id,
            ]
        );

        const project = projectResult.rows[0];

        await client.query(
            `INSERT INTO project_members (project_id, user_id)
            VALUES ($1, $2)`,
            [project.id, user.id]
        );

        await client.query("COMMIT");

        return project;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function listProjects(user: AuthUser) {
    if(user.role === "admin") {
        const result = await pool.query(
            `SELECT p.id, p.name, p.description, p.created_by, p.created_at
            FROM projects p
            ORDER BY p.created_at DESC`
        );

        return result.rows;
    }

    const result = await pool.query(
        `SELECT p.id, p.name, p.description, p.created_by, p.created_at
        FROM projects p
        INNER JOIN project_members pm
            ON pm.project_id = p.id
            WHERE pm.user_id = $1
            ORDER BY p.created_at DESC`,
            [user.id]
    );

    return result.rows;
    
}

export async function getProjectById(
    user: AuthUser,
    projectId: string
) {
    const result = await pool.query(
        `SELECT p.id, p.name, p.description, p.created_by, p.created_at
        FROM projects p
        WHERE p.id = $1
            AND (
            $2::text = 'admin'
            OR EXISTS (
            SELECT 1 
            FROM project_members pm
            WHERE pm.project_id = p.id
            AND pm.user_id = $3
             )
            )`,
            [projectId, user.role, user.id]
    );

    return result.rows[0] ?? null;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
    const result = await pool.query(
        `UPDATE projects
        SET name = COALESCE($2, name),
            description = CASE
            WHEN $3::boolean THIS $4::text
            ELSE description
        END
    WHERE id = $1
    RETURNING id, name, description, created_by, created_at`,
    [
        projectId,
        input.name ?? null,
        Object.hasOwn(input, "description"),
        input.description ?? null, 
    ]
    );
    return result.rows[0] ?? null;
}

export async function deleteProject(projectId: string) {
    const result  = await pool.query(
        `DELETE FROM projects
        WHERE id = $1
        RETURNING id`,
        [projectId]
    );

    return result.rowCount !== null && result.rowCount > 0;
}

export async function listProjectMembers(user: AuthUser, projectId: string) {
    const project = await getProjectById(user, projectId);

    if(!project){
        return null;
    }

    const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, pm.joined_at
        FROM project_mambers pm
        INNER JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id = $1
        ORDER BY pm.joined_at ASC`,
        [projectId],
    );

    return result.rows;  
}

export async function addProjectMember( projectId: string, userId: string) {
    const result = await pool.query(
  `INSERT INTO project_members (project_id, user_id)
   SELECT p.id, usr.id
   FROM projects p
   CROSS JOIN users usr
   WHERE p.id = $1
     AND usr.id = $2
   ON CONFLICT (project_id, user_id) DO NOTHING
   RETURNING project_id, user_id, joined_at`,
  [projectId, userId],
);

    if (result.rows[0]) {
        return { status: "added" as const, member: result.rows[0] };
    }

    const existence = await pool.query(
        `SELECT
            EXISTS(SELECT 1 FROM projects p WHERE p.id = $1) AS project_exists, 
            EXISTS(SELECT 1 FROM users urs WHERE urs.id = $2) AS user_exists,
            EXISTS(
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = $1 AND pm.user_id = $2) AS already_member`,
                [projectId, userId],
    );

    const row = existence.rows[0];

    if(!row.project_exists) {
        return { status: "project_not_found" as const};
    }

    if(!row.user_exists) {
        return { status: "user_not_found" as const};
    }

    if (row.already_member) {
        return { status: "already_member" as const};
    }

    return { status: "conflict" as const};
}

export async function removeProjectMember(projectId: string, userId: string) {
    const result = await pool.query(
        `DELETE FROM project_members
        WHERE project_id = $1 AND user_id = $2
        RETURNING project_id, user_id`,
        [projectId, userId],
    );

    return result.rows[0] ?? null;
}