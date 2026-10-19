import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthError, loginUser, registerUser } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if(!parsed.success) {
            res.status(400).json({
                message: "Invalid registration details",
                errors: parsed.error.issues.map((issues) => ({
                    field: issues.path.join("."),
                    message: issues.message,
                })),
            });
            return;
        }

        const result = await registerUser(parsed.data);

        res.status(201).json({
            message: "Registration successful",
            user: result.user,
            token: result.token,
        });
    } catch (error: unknown) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) : Promise<void> {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if(!parsed.success) {
            res.status(400).json({
                message: "Invalid email or password",
            });
            return;
        }

        const result = await loginUser(parsed.data);

        res.status(200).json({
            message: "Login successful",
            user: result.user,
            token: result.token,
        });
    } catch (error: unknown) {
        if(error instanceof AuthError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        next(error);
    }
}

export function getMe(req: Request, res: Response, next: NextFunction) : void {
    try{
        if(!req.user) {
            res.status(401).json({message: "Authentication required", });
            return;
        }

        res.status(200).json({user:req.user});
    } catch (error: unknown) {
        if(error instanceof ZodError) {
            res.status(400).json({
                message: "Invalid request",
            });
            return;
        }

        next(error);
    }
}