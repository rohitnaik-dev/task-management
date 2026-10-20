
import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().optional(),
    assignedTo: z.string().regex(UUID_REGEX, "Invalid assignee ID").optional(),
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["Pending", "In Progress", "Completed"]).optional(),
    assignedTo: z
      .string()
      .regex(UUID_REGEX, "Invalid assignee ID")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
