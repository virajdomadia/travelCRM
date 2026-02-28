import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { createEmployeeSchema } from "@/lib/validations/employee";

export async function GET(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        if (!agencyId) {
            return NextResponse.json({ message: "Agency ID missing" }, { status: 400 });
        }

        const employees = await prisma.user.findMany({
            where: {
                agencyId,
                role: "AGENCY_EMPLOYEE",
                deletedAt: null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
            },
            orderBy: {
                createdAt: "desc",
            }
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error("GET Employees Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const userId = req.headers.get("x-user-id"); // The admin who is creating

        if (!agencyId || !userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = createEmployeeSchema.parse(body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "A user with this email already exists" },
                { status: 409 }
            );
        }

        // Optional: Check plan limits
        const agency = await prisma.agency.findUnique({
            where: { id: agencyId },
            include: { _count: { select: { users: true } } },
        });

        if (agency && agency._count.users >= agency.planLimitUsers) {
            return NextResponse.json(
                { message: `User limit reached (${agency.planLimitUsers}). Upgrade your plan.` },
                { status: 403 }
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create the employee & write audit log
        const newEmployee = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    role: "AGENCY_EMPLOYEE",
                    agencyId,
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId, // The admin's ID
                    action: "EMPLOYEE_CREATED",
                    entityType: "User",
                    entityId: user.id,
                    metadata: { email: user.email },
                },
            });

            return user;
        });

        return NextResponse.json(
            {
                message: "Employee created successfully",
                employee: { id: newEmployee.id, email: newEmployee.email, role: newEmployee.role }
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input data", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Create Employee Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
