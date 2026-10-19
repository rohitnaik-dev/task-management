import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../modules/auth/auth.service.js"

export function authorizeRole(...allowedRoles: UserRole[]) {
        return (
            req: Request,
            res: Response,
            next: NextFunction,
        ) : void => {
            if(!req.user) {
                res.status(401).json({
                    message: "Authentication required",
                });
                return;
            }

            if(!allowedRoles.includes(req.user.role)) {
                res.status(403).json({
                    message: "You do not have permission to perform this action",
                });
                return;
            }

            next();
        };
    }