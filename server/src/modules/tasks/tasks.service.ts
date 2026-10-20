
import { pool } from "../../db/pool.js";
import type { UserRole } from "../auth/auth.service.js";

export class TaskProjectNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "TaskProjectNotFoundError";
  }
}

export class TaskProjectForbiddenError extends Error {
  constructor() {
    super("You do not have access to this project's tasks");
    this.name = "TaskProjectForbiddenError";
  }
}

export async function listProjectTasks(
  projectId: string,
  userId: string,
  role: UserRole,
) {

  // First check that the project exists
  const projectResult = await pool.query(
    `SELECT id
     FROM projects
     WHERE id = $1`,
    [projectId],
  );

  if (projectResult.rowCount === 0) {
    throw new TaskProjectNotFoundError();
  }

  // Admins may access tasks across all projects
  if (role !== "admin") {
    const membershipResult = await pool.query(
      `SELECT 1
       FROM project_members
       WHERE project_id = $1
         AND user_id = $2`,
      [projectId, userId],
    );

    if (membershipResult.rowCount === 0) {
      throw new TaskProjectForbiddenError();
    }
  }

  // Return tasks in their persisted project order
  const tasksResult = await pool.query(
    `SELECT
       t.id,
       t.project_id AS "projectId",
       t.title,
       t.description,
       t.status,
       t.assigned_to AS "assignedTo",
       t.position,
       t.created_by AS "createdBy",
       t.created_at AS "createdAt",
       t.updated_at AS "updatedAt",
       CASE
         WHEN assignee.id IS NULL THEN NULL
         ELSE json_build_object(
           'id', assignee.id,
           'name', assignee.name
         )
       END AS assignee
     FROM tasks t
     LEFT JOIN users assignee
       ON assignee.id = t.assigned_to
     WHERE t.project_id = $1
     ORDER BY t.position ASC, t.id ASC`,
    [projectId],
  );

  return tasksResult.rows;
}
