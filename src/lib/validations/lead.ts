import { z } from "zod";
import { LeadStatus } from "@prisma/client";

export const createLeadSchema = z.object({
    name: z.string().min(2, "Lead name is required (min 2 characters)"),
    phone: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").optional().nullable(),
    source: z.string().optional().nullable(),
    assignedToId: z.string().uuid("Invalid User ID").optional().nullable(),
    followUpDate: z.string().datetime().optional().nullable(), // expecting ISO string
});

export const updateLeadSchema = z.object({
    name: z.string().min(2, "Lead name must be at least 2 characters").optional(),
    phone: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").optional().nullable(),
    source: z.string().optional().nullable(),
    followUpDate: z.string().datetime().optional().nullable(),
});

export const updateLeadStatusSchema = z.object({
    status: z.nativeEnum(LeadStatus, {
        message: "Invalid lead status"
    }),
});

export const assignLeadSchema = z.object({
    assignedToId: z.string().uuid("Invalid Employee ID").nullable(), // null means unassign
});

export const addLeadNoteSchema = z.object({
    content: z.string().min(1, "Note content cannot be empty"),
});
