import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate request body
        const { email, password } = loginSchema.parse(body);

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Compare provided password with stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = await signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Create response
        const response = NextResponse.json(
            { message: "Login successful", role: user.role },
            { status: 200 }
        );

        // Set HTTP-only cookie
        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return response;
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input data", errors: error.issues },
                { status: 400 }
            );
        }

        console.error("Login Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
