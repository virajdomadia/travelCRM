// In a production serverless environment this should use Upstash Redis,
// but an in-memory Map is sufficient for local development and non-distributed Node.js instances.
type RateLimitInfo = { count: number; expiresAt: number };
const rateLimitMap = new Map<string, RateLimitInfo>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    let record = rateLimitMap.get(ip);

    // Clear out expired or initialize new record
    if (!record || record.expiresAt < now) {
        record = { count: 1, expiresAt: now + windowMs };
        rateLimitMap.set(ip, record);
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}
