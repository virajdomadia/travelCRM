import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { verifyToken } from "@/lib/auth";
import ImpersonationBanner from "@/features/auth/components/ImpersonationBanner";

export default async function AgencyAdminLayout({ children }: { children: React.ReactNode }) {
    // In App Router, getting cookies info server-side to pass role
    // Since proxy.ts intercepts the request, `x-user-role` is injected into headers!
    const headersList = await headers();
    const role = headersList.get("x-user-role") || "AGENCY_ADMIN"; // Fallback to assumed role

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col overflow-hidden">
            <ImpersonationBanner />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar role={role} />
                <main className="flex-1 ml-64 p-8 w-[calc(100vw-16rem)] min-w-0 overflow-y-auto h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
