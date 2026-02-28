import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { updateEmployeeSchema } from "@/lib/validations/employee";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const adminUserId = req.headers.get("x-user-id");
        const { id: employeeId } = await params;

        if (!agencyId || !adminUserId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = updateEmployeeSchema.parse(body);

        // Verify the employee belongs to this agency
        const existingEmployee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                agencyId,
                role: "AGENCY_EMPLOYEE",
                deletedAt: null,
            },
        });

        if (!existingEmployee) {
            return NextResponse.json({ message: "Employee not found in your agency" }, { status: 404 });
        }

        if (data.email && data.email !== existingEmployee.email) {
            const emailInUse = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (emailInUse) {
                return NextResponse.json({ message: "Email is already in use by another user" }, { status: 409 });
            }
        }

        const updatedEmployee = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: employeeId },
                data: {
                    email: data.email,
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId: adminUserId,
                    action: "EMPLOYEE_UPDATED",
                    entityType: "User",
                    entityId: user.id,
                    metadata: { changes: data },
                },
            });

            return user;
        });

        return NextResponse.json(
            {
                message: "Employee updated successfully",
                employee: { id: updatedEmployee.id, email: updatedEmployee.email, role: updatedEmployee.role }
            },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input data", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Update Employee Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// Used to Deactivate or Reactivate an employee
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const agencyId = req.headers.get("x-agency-id");
        const adminUserId = req.headers.get("x-user-id");
        const { id: employeeId } = await params;

        if (!agencyId || !adminUserId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { isActive } = body;

        if (typeof isActive !== "boolean") {
            return NextResponse.json({ message: "isActive boolean is required" }, { status: 400 });
        }

        // Verify the employee belongs to this agency
        const existingEmployee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                agencyId,
                role: "AGENCY_EMPLOYEE",
                deletedAt: null,
            },
        });

        if (!existingEmployee) {
            return NextResponse.json({ message: "Employee not found in your agency" }, { status: 404 });
        }

        const updatedEmployee = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: employeeId },
                data: {
                    isActive,
                },
            });

            await tx.auditLog.create({
                data: {
                    agencyId,
                    userId: adminUserId,
                    action: isActive ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
                    entityType: "User",
                    entityId: user.id,
                    metadata: { isActive },
                },
            });

            return user;
        });

        return NextResponse.json(
            {
                message: isActive ? "Employee activated" : "Employee deactivated",
                employee: { id: updatedEmployee.id, isActive: updatedEmployee.isActive }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Patch Employee Status Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
