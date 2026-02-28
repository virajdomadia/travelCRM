import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const role = headersList.get("x-user-role") || "SUPER_ADMIN";

    return (
        <div className="min-h-screen bg-gray-950 flex">
            <Sidebar role={role} />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
