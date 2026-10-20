
import { pool } from "../../db/pool.js";
import type { UserRole } from "../auth/auth.service.js";
import type { PoolClient } from "pg";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schemas.js";
import { getSocketServer } from "../../socket/socket.instance.js";

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

export class TaskNotFoundError extends Error {
  constructor() {
    super("Task not found in this project");
    this.name = "TaskNotFoundError";
  }
}


function emitProjectTaskEvent(
  projectId: string,
  event: string,
  payload: unknown,
): void {
  try {
    getSocketServer()
      .to(`project:${projectId}`)
      .emit(event, payload);
  } catch (error) {
    console.error("Failed to emit task event:", error);
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


export class TaskAssigneeForbiddenError extends Error {
    constructor() {
        super("Assignee must be a member of this project");
        this.name = "TaskAssigneeForbiddenError";
    }
}


export async function createProjectTask(
  projectId: string,
  userId: string,
  role: UserRole,
  input: CreateTaskInput,
) {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query("BEGIN");
    inTransaction = true;

    // Lock the project row so task creation is serialized
    // for this project.
    const projectResult = await client.query(
      `SELECT id
       FROM projects
       WHERE id = $1
       FOR UPDATE`,
      [projectId],
    );

    if (projectResult.rows.length === 0) {
      throw new TaskProjectNotFoundError();
    }

    // Admins can create tasks in any existing project.
    if (role !== "admin") {
      const membershipResult = await client.query(
        `SELECT 1
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, userId],
      );

      if (membershipResult.rows.length === 0) {
        throw new TaskProjectForbiddenError();
      }
    }

    // If an assignee was provided, ensure they belong
    // to this project.
    if (input.assignedTo !== undefined) {
      const assigneeResult = await client.query(
        `SELECT 1
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, input.assignedTo],
      );

      if (assigneeResult.rows.length === 0) {
        throw new TaskAssigneeForbiddenError();
      }
    }

    // The project lock prevents competing calls using
    // this same locking strategy from choosing the same position.
    const positionResult = await client.query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS position
       FROM tasks
       WHERE project_id = $1`,
      [projectId],
    );

    const position = positionResult.rows[0].position;

    // Insert the task and return the same shape as the GET endpoint.
    const taskResult = await client.query(
      `WITH inserted_task AS (
         INSERT INTO tasks (
           project_id,
           title,
           description,
           status,
           assigned_to,
           position,
           created_by
         )
         VALUES ($1, $2, $3, 'Pending', $4, $5, $6)
         RETURNING
           id,
           project_id,
           title,
           description,
           status,
           assigned_to,
           position,
           created_by,
           created_at,
           updated_at
       )
       SELECT
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
       FROM inserted_task t
       LEFT JOIN users assignee
         ON assignee.id = t.assigned_to`,
      [
        projectId,
        input.title,
        input.description ?? null,
        input.assignedTo ?? null,
        position,
        userId,
      ],
    );

    await client.query("COMMIT");
    inTransaction = false;

    emitProjectTaskEvent(
  projectId,
  "task:created",
  taskResult.rows[0],
);

    return taskResult.rows[0];
  } catch (error: unknown) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }
    }

    throw error;
  } finally {
    client.release();
  }
}



export async function updateProjectTask(
  projectId: string,
  taskId: string,
  userId: string,
  role: UserRole,
  input: UpdateTaskInput,
) {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query("BEGIN");
    inTransaction = true;

    // Verify that the project exists.
    const projectResult = await client.query(
      `SELECT id
       FROM projects
       WHERE id = $1`,
      [projectId],
    );

    if (projectResult.rowCount === 0) {
      throw new TaskProjectNotFoundError();
    }

    // Admins may update tasks in any project.
    // Regular users must be project members.
    if (role !== "admin") {
      const membershipResult = await client.query(
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

    // Lock the task to prevent concurrent updates from
    // overwriting one another while this transaction runs.
    const existingTaskResult = await client.query(
      `SELECT id
       FROM tasks
       WHERE id = $1
         AND project_id = $2
       FOR UPDATE`,
      [taskId, projectId],
    );

    if (existingTaskResult.rowCount === 0) {
      throw new TaskNotFoundError();
    }

    // Validate a newly supplied assignee.
    // Null explicitly clears the assignment.
    if (
      input.assignedTo !== undefined &&
      input.assignedTo !== null
    ) {
      const assigneeResult = await client.query(
        `SELECT 1
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, input.assignedTo],
      );

      if (assigneeResult.rowCount === 0) {
        throw new TaskAssigneeForbiddenError();
      }
    }

    // Build the SET clause exclusively from validated,
    // explicitly supplied fields. Values remain parameterized.
    const columnMap = {
      title: "title",
      description: "description",
      status: "status",
      assignedTo: "assigned_to",
    } as const;

    const values: unknown[] = [taskId, projectId];
    const assignments: string[] = [];

    for (const key of Object.keys(input) as Array<
      keyof UpdateTaskInput
    >) {
      const column = columnMap[key];

      values.push(input[key]);
      assignments.push(`${column} = $${values.length}`);
    }

    assignments.push("updated_at = NOW()");

    const taskResult = await client.query(
      `UPDATE tasks
       SET ${assignments.join(", ")}
       WHERE id = $1
         AND project_id = $2
       RETURNING
         id,
         project_id AS "projectId",
         title,
         description,
         status,
         assigned_to AS "assignedTo",
         position,
         created_by AS "createdBy",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      values,
    );

    
    const updatedTask = taskResult.rows[0];

    const assigneeResult = await client.query(
      `SELECT id, name
       FROM users
       WHERE id = $1`,
      [updatedTask.assignedTo],
    );

    updatedTask.assignee = assigneeResult.rowCount
      ? {
          id: assigneeResult.rows[0].id,
          name: assigneeResult.rows[0].name,
        }
      : null;

    await client.query("COMMIT");
    inTransaction = false;

    emitProjectTaskEvent(
  projectId,
  "task:updated",
  updatedTask,
);

    return updatedTask;
  } catch (error: unknown) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }
    }

    throw error;
  } finally {
    client.release();
  }
}



export async function deleteProjectTask(
  projectId: string,
  taskId: string,
  userId: string,
  role: UserRole,
): Promise<void> {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query("BEGIN");
    inTransaction = true;

    // 1. Verify that the project exists.
    const projectResult = await client.query(
      `SELECT id
       FROM projects
       WHERE id = $1`,
      [projectId],
    );

    if (projectResult.rowCount === 0) {
      throw new TaskProjectNotFoundError();
    }

    // 2. Admins can delete tasks in any project.
    // Regular users must be project members.
    if (role !== "admin") {
      const membershipResult = await client.query(
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

    // 3. Delete only if the task belongs to this project.
    const deleteResult = await client.query(
      `DELETE FROM tasks
       WHERE id = $1
         AND project_id = $2
       RETURNING id`,
      [taskId, projectId],
    );

    if (deleteResult.rowCount === 0) {
      throw new TaskNotFoundError();
    }

    await client.query("COMMIT");
    inTransaction = false;


    emitProjectTaskEvent(
  projectId,
  "task:deleted",
  { id: taskId, projectId },
);

  } catch (error: unknown) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }
    }

    throw error;
  } finally {
    client.release();
  }
}


export class TaskReorderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskReorderValidationError";
  }
}

export async function reorderProjectTasks(
  projectId: string,
  userId: string,
  role: UserRole,
  taskIds: string[],
) {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query("BEGIN");
    inTransaction = true;

    // Lock the project to coordinate concurrent task creation
    // and reordering operations that use the same lock.
    const projectResult = await client.query(
      `SELECT id
       FROM projects
       WHERE id = $1
       FOR UPDATE`,
      [projectId],
    );

    if (projectResult.rowCount === 0) {
      throw new TaskProjectNotFoundError();
    }

    // Admins can reorder tasks in any project.
    // Other users must be project members.
    if (role !== "admin") {
      const membershipResult = await client.query(
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

    // Lock the project's tasks and retrieve their current IDs.
    const existingTasksResult = await client.query(
      `SELECT id
       FROM tasks
       WHERE project_id = $1
       ORDER BY position ASC, id ASC
       FOR UPDATE`,
      [projectId],
    );

    const existingTaskIds = existingTasksResult.rows.map(
      (task: { id: string }) => task.id,
    );

    // Reject a list that omits tasks or contains IDs that
    // do not belong to this project.
    if (
  taskIds.length !== existingTaskIds.length ||
  new Set(taskIds).size !== taskIds.length ||
  taskIds.some((id) => !existingTaskIds.includes(id))
) {
  throw new TaskReorderValidationError(
    "taskIds must contain every task in this project exactly once",
  );
}

    // Assign consecutive positions according to array order.
    // The position constraint is deferred until COMMIT, so
    // swapping existing positions is safe within this transaction.
    for (const [index, taskId] of taskIds.entries()) {
      const result = await client.query(
        `UPDATE tasks
         SET position = $1,
             updated_at = NOW()
         WHERE id = $2
           AND project_id = $3`,
        [index + 1, taskId, projectId],
      );

      if (result.rowCount !== 1) {
        throw new Error(
          `Failed to update position for task ${taskId}`,
        );
      }
    }

    // Return the persisted order and the same basic task
    // representation used by the GET endpoint.
    const updatedTasksResult = await client.query(
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

    await client.query("COMMIT");
    inTransaction = false;

    emitProjectTaskEvent(
  projectId,
  "tasks:reordered",
  updatedTasksResult.rows,
);

    return updatedTasksResult.rows;
  } catch (error: unknown) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original error.
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

