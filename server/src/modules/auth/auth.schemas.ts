import {z} from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be al least 2 characters")
        .max(100, "Name must not exceed 100 characters"),

    email: z
        .string()
        .trim()
        .email("Enter a valid email address")
        .max(254, "Email is too long"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters"),

});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Enter a valid email address")
        .max(257, "Email is too long"),


    password: z
        .string()
        .min(1, "Password is required")
        .max(72, "Email is too long"),

});

export type RegisterInput  = z.infer<typeof registerSchema>
export type LoginInput  = z.infer<typeof loginSchema>