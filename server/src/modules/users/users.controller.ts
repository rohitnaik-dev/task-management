import type { Request, Response, NextFunction } from "express";
import { userIdSchema, UpdateUserRoleSchema } from "./users.schemas.js";
import { getAllUsers, updateUserRole } from "./users.service.js";

export async function listUsers(_req: Request, res: Response, next: NextFunction) : Promise<void> {
    try {
        const users = await getAllUsers();
        res.status(200).json({ users });
    } catch (error: unknown) {
        next(error);
    }
}

export async function changeUserRole(req: Request, res: Response, next: NextFunction) : Promise<void> {
    const paramsResult = userIdSchema.safeParse(req.params);
    const bodyResult = UpdateUserRoleSchema.safeParse(req.body);

    if(!paramsResult.success) {
        res.status(400).json({ message: "Invalid user ID", errors: paramsResult.error.flatten(),});
        return;
    }

    if(!bodyResult.success) {
        res.status(400).json({
            message: "Invalid request body",
            errors: bodyResult.error.flatten(),
        });
        return;
    }

    const {id} = paramsResult.data;
    const {role} = bodyResult.data;

    if(req.user?.id === id && role !== "admin") {
        res.status(400).json({ message: "You cannot remove your own Admin role"});
        return;
    }

    try {
        const user = await updateUserRole(id, role);

        if(!user) {
            res.status(404).json({ message: "User not found",});
            return;
        }

        res.status(200).json({ message: "User role updated successfully", user,});
    } catch (error: unknown) {
        next(error);
    }
}