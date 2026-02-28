import crypto from 'crypto';
import prisma from './prisma';

// Use the base prisma client since Session manipulation doesn't require tenant RLS context 
// (Session model doesn't have an agencyId), and it avoids TS extension inference limits.
const db = prisma;

export function generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
}

export async function createSession(userId: string, userAgent?: string, ip?: string) {
    const rawToken = generateRefreshToken();
    // SHA-256 hash for fast DB lookup
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const familyId = crypto.randomUUID();

    await db.session.create({
        data: {
            userId,
            hashedToken,
            familyId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
            userAgent,
            ipAddress: ip
        }
    });

    return rawToken;
}

export async function rotateRefreshToken(oldRawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(oldRawToken).digest('hex');

    // Find matching session
    const session = await db.session.findUnique({ where: { hashedToken: tokenHash } });

    if (!session) throw new Error("Invalid session token");
    if (session.expiresAt < new Date()) throw new Error("Session expired");

    // REUSE DETECTION (Theft)
    if (session.isRevoked) {
        // Attack detected: A previously used token in this family was used again.
        // We must revoke the ENTIRE family.
        await db.session.updateMany({
            where: { familyId: session.familyId },
            data: { isRevoked: true }
        });
        throw new Error("Session compromised. All devices using this session family have been logged out.");
    }

    // Revoke old token to prevent legitimate reuse
    await db.session.update({
        where: { id: session.id },
        data: { isRevoked: true }
    });

    // Issue new token in same family
    const newRawToken = generateRefreshToken();
    const newHash = crypto.createHash('sha256').update(newRawToken).digest('hex');

    await db.session.create({
        data: {
            userId: session.userId,
            familyId: session.familyId,
            hashedToken: newHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Extend another 7 days
        }
    });

    return { newRawToken, userId: session.userId };
}
