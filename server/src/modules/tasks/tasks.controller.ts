
import type { Request, Response, NextFunction } from "express";
import { listProjectTasks, TaskProjectForbiddenError, TaskProjectNotFoundError } from "./tasks.service.js";
import { isValidUuid } from "./tasks.schemas.js";

export async function getProjectTasks(req: Request, res: Response, next: NextFunction ): Promise<void> {
  const projectId = req.params.projectId;

  if (typeof projectId !== "string" || !isValidUuid(projectId)) {
    res.status(400).json({
      message: "Invalid project ID",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  try {
    const tasks = await listProjectTasks(
      projectId,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({ tasks });
  } catch (error: unknown) {
    if (error instanceof TaskProjectNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof TaskProjectForbiddenError) {
      res.status(403).json({ message: error.message });
      return;
    }

    next(error);
  }
}
