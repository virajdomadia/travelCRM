import { SignJWT, jwtVerify } from "jose";

function getSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not defined");
    }
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    agencyId?: string;
    agencyIsActive?: boolean;
    subscriptionEnds?: string | null;
}

export async function signToken(payload: JwtPayload): Promise<string> {
    const jwt = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m") // Short-lived Access Token (15m)
        .sign(getSecret());

    return jwt;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as JwtPayload;
    } catch (error) {
        // Return null if token is invalid or expired
        return null;
    }
}
