import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

// Temporary endpoint to create an initial test user
export async function GET() {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: "admin@travelos.com" }
        });

        if (existingUser) {
            return NextResponse.json({ message: "Test user already exists" });
        }

        const hashedPassword = await bcrypt.hash("password123", 10);

        const user = await prisma.user.create({
            data: {
                email: "admin@travelos.com",
                password: hashedPassword,
                role: "SUPER_ADMIN",
            }
        });

        return NextResponse.json({
            message: "Test user created successfully",
            user: { email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Setup Error:", error);
        return NextResponse.json(
            { message: "Failed to set up test user", error },
            { status: 500 }
        );
    }
}
