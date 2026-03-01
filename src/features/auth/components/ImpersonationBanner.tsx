import { headers } from "next/headers";
import Link from "next/link";
import { UserMinus, AlertCircle } from "lucide-react";
import { verifyToken } from "@/lib/auth";

export default async function ImpersonationBanner() {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const role = headersList.get("x-user-role");

    // We need to check if we are impersonating. 
    // The middleware sets x-user-id and x-user-role. 
    // But to know if it's impersonation, we need to check the JWT payload in the cookie.

    // In server components, we can get cookies.
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.originalUserId) return null;

    return (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between font-medium text-sm sticky top-0 z-[100] shadow-md border-b border-amber-600/20">
            <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 animate-pulse" />
                <span>
                    <strong>Impersonation Active:</strong> You are currently logged in as <strong>{payload.email}</strong>
                </span>
            </div>
            <Link
                href="/api/super-admin/impersonate/exit"
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-950 text-amber-500 rounded-lg hover:bg-amber-900 transition-colors border border-amber-900/50 group"
            >
                <UserMinus className="w-3.5 h-3.5" />
                Exit Impersonation
            </Link>
        </div>
    );
}
