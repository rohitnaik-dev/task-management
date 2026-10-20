import type { Request, Response, NextFunction } from "express";
import { createProject, listProjects, getProjectById, updateProject, deleteProject , listProjectMembers, addProjectMember, removeProjectMember} from "./projects.service.js";
import { createProjectSchema, updateProjectSchema, projectIdSchema , projectMemberParamsSchema, addProjectMemberSchema} from "./projects.schemas.js";

export async function createProjectController(req: Request, res: Response, next: NextFunction) : Promise<void> {

    try {
        const parsed = createProjectSchema.safeParse(req.body);
        
        if(!parsed.success) {
            res.status(400).json({
                message: "Invalid project data",
                error: parsed.error.flatten(),
            });
            return;
        }

        const project = await createProject(req.user!, parsed.data);

        res.status(201).json({ project });
    } catch (error) {
        next(error);
    }
}

export async function listProjectsController(req:Request, res: Response, next: NextFunction) :Promise<void> {
    try {
        const projects = await listProjects(req.user!);

        res.status(200).json({ projects });
    } catch (error) {
        next(error);
    }
}

export async function getProjectController(req:Request, res: Response, next: NextFunction): Promise<void> {
    try{
        const parsed = projectIdSchema.safeParse(req.params);

        if(!parsed.success) {
            res.status(400).json({
                message: "Invalid project ID",
            });
            return;
        }

        const project = await getProjectById(
            req.user!,
            parsed.data.projectId,
        );

        if(!project) {
            res.status(404).json({
                message: "Project not found",
            });
            return;
        }

        res.status(200).json({ project });
    } catch (error) {
        next(error);
    }
}

export async function updateProjectController(req:Request, res: Response, next: NextFunction): Promise<void> {
    
    try{
        const params = projectIdSchema.safeParse(req.params);
        const body = updateProjectSchema.safeParse(req.body);

        if(!params.success || !body.success) {
            res.status(400).json({
                message: "Invalid project ID or update data",
            });
            return;
        }

        const project = await updateProject(
            params.data.projectId,
            body.data
        );

        if(!project) {
            res.status(404).json({ message: "Project not found"});
            return;
        }

        res.status(200).json({ project});
    } catch(error){
        next(error);
    }
}

export async function deleteProjectController(req:Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parsed = projectIdSchema.safeParse(req.params);

        if(!parsed.success) {
            res.status(400).json({ message: "Invalid project ID",});
            return;
        }

        const deleted = await deleteProject(parsed.data.projectId);

        if(!deleted) {
            res.status(404).json({
                message: "Project not found",
            });
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}


export async function listProjectMembersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = projectIdSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid project ID" });
      return;
    }

    const members = await listProjectMembers(
      req.user!,
      parsed.data.projectId,
    );

    if (members === null) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
}

export async function addProjectMemberController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = projectIdSchema.safeParse(req.params);
    const body = addProjectMemberSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        message: "Invalid project ID or member data",
      });
      return;
    }

    const result = await addProjectMember(
      params.data.projectId,
      body.data.userId,
    );

    switch (result.status) {
      case "added":
        res.status(201).json({ member: result.member });
        return;

      case "project_not_found":
        res.status(404).json({ message: "Project not found" });
        return;

      case "user_not_found":
        res.status(404).json({ message: "User not found" });
        return;

      case "already_member":
        res.status(409).json({
          message: "User is already a project member",
        });
        return;

      default:
        res.status(409).json({
          message: "Membership could not be created; please retry",
        });
        return;
    }
  } catch (error) {
    next(error);
  }
}

export async function removeProjectMemberController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = projectMemberParamsSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({
        message: "Invalid project or user ID",
      });
      return;
    }

    const removed = await removeProjectMember(
      params.data.projectId,
      params.data.userId,
    );

    if (!removed) {
      res.status(404).json({
        message: "Project membership not found",
      });
      return;
    }

    res.status(200).json({
      message: "Project member removed successfully",
    });
  } catch (error) {
    next(error);
  }
}
