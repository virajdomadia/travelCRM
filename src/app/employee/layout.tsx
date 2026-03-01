import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { verifyToken } from "@/lib/auth";
import ImpersonationBanner from "@/features/auth/components/ImpersonationBanner";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const role = headersList.get("x-user-role") || "AGENCY_EMPLOYEE";

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            <ImpersonationBanner />
            <div className="flex flex-1">
                <Sidebar role={role} />
                <main className="flex-1 ml-64 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
