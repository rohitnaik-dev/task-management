
import { pool } from "../db/pool.js";
import type { SocketUser } from "./socket.types.js";

export class ProjectRoomNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "ProjectRoomNotFoundError";
  }
}

export class ProjectRoomForbiddenError extends Error {
  constructor() {
    super("You do not have access to this project");
    this.name = "ProjectRoomForbiddenError";
  }
}

export async function authorizeProjectRoom(
  user: SocketUser,
  projectId: string,
): Promise<void> {
  const projectResult = await pool.query(
    `SELECT id
     FROM projects
     WHERE id = $1`,
    [projectId],
  );

  if (projectResult.rowCount === 0) {
    throw new ProjectRoomNotFoundError();
  }

  // Admins may join any existing project's room.
  if (user.role === "admin") {
    return;
  }

  const membershipResult = await pool.query(
    `SELECT 1
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
    [projectId, user.id],
  );

  if (membershipResult.rowCount === 0) {
    throw new ProjectRoomForbiddenError();
  }
}

export function getProjectRoomName(projectId: string): string {
  return `project:${projectId}`;
}
