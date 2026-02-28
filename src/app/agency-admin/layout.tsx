import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { verifyToken } from "@/lib/auth";

export default async function AgencyAdminLayout({ children }: { children: React.ReactNode }) {
    // In App Router, getting cookies info server-side to pass role
    // Since proxy.ts intercepts the request, `x-user-role` is injected into headers!
    const headersList = await headers();
    const role = headersList.get("x-user-role") || "AGENCY_ADMIN"; // Fallback to assumed role

    return (
        <div className="min-h-screen bg-gray-950 flex">
            <Sidebar role={role} />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
