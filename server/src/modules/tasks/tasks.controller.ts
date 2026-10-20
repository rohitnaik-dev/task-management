
import type { Request, Response, NextFunction } from "express";
import { listProjectTasks, TaskProjectForbiddenError, TaskProjectNotFoundError, createProjectTask, TaskAssigneeForbiddenError, updateProjectTask, TaskNotFoundError, deleteProjectTask } from "./tasks.service.js";
import { isValidUuid, createTaskSchema, updateTaskSchema } from "./tasks.schemas.js";

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



export async function postProjectTask(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  const parsed = createTaskSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid task data",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const task = await createProjectTask(
      projectId,
      req.user.id,
      req.user.role,
      parsed.data,
    );

    res.status(201).json({ task });
  } catch (error: unknown) {
    if (error instanceof TaskProjectNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof TaskProjectForbiddenError) {
      res.status(403).json({ message: error.message });
      return;
    }

    if (error instanceof TaskAssigneeForbiddenError) {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
}



export async function patchProjectTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { projectId, taskId } = req.params;

  if (
    typeof projectId !== "string" ||
    !isValidUuid(projectId) ||
    typeof taskId !== "string" ||
    !isValidUuid(taskId)
  ) {
    res.status(400).json({
      message: "Invalid project ID or task ID",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  const parsed = updateTaskSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid task data",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const task = await updateProjectTask(
      projectId,
      taskId,
      req.user.id,
      req.user.role,
      parsed.data,
    );

    res.status(200).json({ task });
  } catch (error: unknown) {
    if (
      error instanceof TaskProjectNotFoundError ||
      error instanceof TaskNotFoundError
    ) {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error instanceof TaskProjectForbiddenError) {
      res.status(403).json({ message: error.message });
      return;
    }

    if (error instanceof TaskAssigneeForbiddenError) {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
}



export async function deleteProjectTaskController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { projectId, taskId } = req.params;

  // 1. Validate both UUIDs.
  if (
    typeof projectId !== "string" ||
    !isValidUuid(projectId) ||
    typeof taskId !== "string" ||
    !isValidUuid(taskId)
  ) {
    res.status(400).json({
      message: "Invalid project ID or task ID",
    });
    return;
  }

  // 2. Require authentication.
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  try {
    // 3. Perform the authorized deletion.
    await deleteProjectTask(
      projectId,
      taskId,
      req.user.id,
      req.user.role,
    );

    // 4. Successful DELETE returns no response body.
    res.status(204).end();
  } catch (error: unknown) {
    if (
      error instanceof TaskProjectNotFoundError ||
      error instanceof TaskNotFoundError
    ) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    if (error instanceof TaskProjectForbiddenError) {
      res.status(403).json({
        message: error.message,
      });
      return;
    }

    next(error);
  }
}
