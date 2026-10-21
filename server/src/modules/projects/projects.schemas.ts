import {z} from "zod";

export const createProjectSchema = z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).nullable().optional(), 
});

export const updateProjectSchema = z.object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided"}
);

export const projectIdSchema = z.object({
    projectId: z.string().uuid(),
});

export const projectMemberParamsSchema = z.object({
    projectId: z.string().uuid(),
    userId: z.string().uuid(),
});

export const addProjectMemberSchema = z.object({
    userId: z.string().uuid(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.input<typeof addProjectMemberSchema>;