import { NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/session";
import { signToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const cookieStr = req.headers.get("cookie") || "";
        const match = cookieStr.match(/travelos_refresh=([^;]+)/);
        const refreshToken = match ? match[1] : null;

        if (!refreshToken) {
            return NextResponse.json({ message: "No refresh token provided" }, { status: 401 });
        }

        // Rotate token (will throw if invalid/expired/stolen)
        const { newRawToken, userId } = await rotateRefreshToken(refreshToken);

        // Fetch user to sign new JWT
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // Create short-lived JWT token (15 mins)
        const newJwt = await signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            agencyId: user.agencyId || undefined,
        });

        // Create response
        const response = NextResponse.json({ message: "Token refreshed successfully" });

        // Set short-lived Access Token Cookie
        response.cookies.set({
            name: "auth-token",
            value: newJwt,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });

        // Set long-lived Refresh Token Cookie
        response.cookies.set({
            name: "travelos_refresh",
            value: newRawToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Refresh Error:", error);

        // If the token was bad, we should strip the cookies to force re-login
        const response = NextResponse.json({ message: "Invalid session" }, { status: 401 });
        response.cookies.delete("auth-token");
        response.cookies.delete("travelos_refresh");
        return response;
    }
}
