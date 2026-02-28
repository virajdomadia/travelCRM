import { SignJWT, jwtVerify } from "jose";

// Use a fallback secret for development; in production, always provide a strong JWT_SECRET
const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback_secret_for_development_purposes_only_changeme"
);

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
    const jwt = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h") // Token expires in 24 hours
        .sign(secret);

    return jwt;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JwtPayload;
    } catch (error) {
        // Return null if token is invalid or expired
        return null;
    }
}
