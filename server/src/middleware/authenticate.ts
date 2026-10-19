import type { Request, Response, NextFunction } from "express";
import { AuthError, findUserById, verifyAccessToken } from "../modules/auth/auth.service.js";

export async function authenticate(req:Request, res: Response, next: NextFunction): Promise<void> {
    const authorization = req.headers.authorization;

    if(!authorization?.startsWith("Bearer")) {
        res.status(401).json({
            message: "Authentication required",
        });
        return;
    }

    const token = authorization.slice(7).trim();

    if(!token ) {
        res.status(401).json({
            message: "Invalid or expired token",
        });
        return;
    }

    try {
        const userId = verifyAccessToken(token);
        const user = await findUserById(userId);

        if(!user) {
            res.status(401).json({
                message: "Invalid or expired token",
            });
             return;
        }

        req.user = user;
        next();
    } catch (error: unknown) {
        if(error instanceof AuthError) {
        res.status(error.statusCode).json({
            message: error.message,
        });
        return;

    }
  next(error);  
}}