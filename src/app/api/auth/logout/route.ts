import { NextResponse } from "next/server";
import { getSystemClient } from "@/lib/prisma";
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const cookieStr = req.headers.get("cookie") || "";
        const match = cookieStr.match(/travelos_refresh=([^;]+)/);
        const refreshToken = match ? match[1] : null;

        if (refreshToken) {
            // Hash the token to find the DB record and revoke it
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const db = getSystemClient();

            await db.session.updateMany({
                where: { hashedToken: tokenHash },
                data: { isRevoked: true }
            });
        }

        const response = NextResponse.json({ message: "Logged out successfully" });

        // Clear cookies
        response.cookies.delete("auth-token");
        response.cookies.delete("travelos_refresh");

        return response;
    } catch (error) {
        console.error("Logout Error:", error);
        return NextResponse.json({ message: "Failed to log out cleanly" }, { status: 500 });
    }
}
