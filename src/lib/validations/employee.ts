import { z } from "zod";

export const createEmployeeSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    role: z.enum(["AGENCY_EMPLOYEE"]).default("AGENCY_EMPLOYEE"),
});

export const updateEmployeeSchema = z.object({
    email: z.string().email("Invalid email address").optional(),
});
