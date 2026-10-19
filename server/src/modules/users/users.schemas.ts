import {z} from "zod";
export const userIdSchema = z.object({ id: z.string().uuid(),});

export const UpdateUserRoleSchema = z.object({ role: z.enum(["user", "admin"]),});

export type UpdateUserRoleSchema = z.infer<typeof UpdateUserRoleSchema>;

