import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

// Temporary endpoint to create an initial test user (Development only)
export async function GET() {
    // Security check: Only allow in development mode explicitly with an extra env flag
    if (process.env.NODE_ENV !== "development" || process.env.ALLOW_DEV_SETUP !== "true") {
        return NextResponse.json(
            { message: "Setup endpoint is disabled or not in development environment." },
            { status: 403 }
        );
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: "admin@travelos.com" }
        });

        if (existingUser) {
            return NextResponse.json({ message: "Test user already exists" });
        }

        const devPassword = process.env.DEV_ADMIN_PASSWORD || crypto.randomUUID();
        console.log(`[SETUP] SUPER_ADMIN Password: ${devPassword}`);
        const hashedPassword = await bcrypt.hash(devPassword, 10);

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
