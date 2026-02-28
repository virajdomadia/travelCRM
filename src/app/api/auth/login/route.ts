import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { signToken } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

// Use a constant dummy hash to mitigate timing-based enumeration attacks when user is not found.
// This is the result of bcrypt.hash("dummy", 10).
const DUMMY_PASSWORD_HASH = "$2b$10$U.2TjU5A1vGXYl9iWp0x2e0.gNxtiH/P2e2S1xYXg5S2T2vT9wZ/G";

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

        // 5 attempts per 15 minutes
        if (!checkRateLimit(ip, 5, 15 * 60 * 1000)) {
            return NextResponse.json(
                { message: "Too many login attempts. Please try again later." },
                { status: 429 }
            );
        }

        const body = await req.json();

        // Validate request body
        const { email, password } = loginSchema.parse(body);

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: { agency: true },
        });

        if (!user) {
            // Run a dummy compare to protect against timing attacks
            await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // --- ACCOUNT LOCKOUT CHECK ---
        if (user.lockUntil && user.lockUntil > new Date()) {
            return NextResponse.json(
                { message: "Account locked due to too many failed attempts. Try again later." },
                { status: 403 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { message: "Your account is deactivated." },
                { status: 403 }
            );
        }

        // Compare provided password with stored hash
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            // Increment failed attempts
            const attempts = user.failedLoginAttempts + 1;
            const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: attempts,
                    lockUntil: lockUntil,
                },
            });

            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Reset failed attempts and track successful login
        const userAgent = req.headers.get("user-agent") || "Unknown";

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockUntil: null,
                    lastLoginAt: new Date(),
                },
            }),
            // Optional but highly recommended: strictly write AuditLog for the security event
            ...(user.agencyId ? [
                prisma.auditLog.create({
                    data: {
                        agencyId: user.agencyId,
                        userId: user.id,
                        action: "USER_LOGIN_SUCCESS",
                        entityType: "User",
                        entityId: user.id,
                        ipAddress: ip,
                        userAgent: userAgent,
                    }
                })
            ] : []) // Cannot log agencyId if SUPER_ADMIN without an agency
        ]);

        // Create short-lived JWT token (15 mins)
        const token = await signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            agencyId: user.agencyId || undefined,
            agencyIsActive: user.agency?.isActive,
            subscriptionEnds: user.agency?.subscriptionEnds?.toISOString() || null,
        });

        // Create long-lived Refresh Token (7 days)
        // ip and userAgent are already defined above, so we reuse them.
        const refreshToken = await createSession(user.id, userAgent, ip);

        // Create response
        const response = NextResponse.json(
            { message: "Login successful", role: user.role },
            { status: 200 }
        );

        // Set short-lived Access Token Cookie
        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });

        // Set long-lived Refresh Token Cookie
        response.cookies.set({
            name: "travelos_refresh",
            value: refreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            // /api/auth path limitation could be used here, but we'll stick to / for ease of edge proxy usage
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
