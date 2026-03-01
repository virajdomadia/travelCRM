"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserCircle,
    LogOut,
    Briefcase,
    ShoppingBag
} from "lucide-react";

export function Sidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh(); // forces Next to reload the root layout and update cookies state
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const navItems = [];

    if (role === "SUPER_ADMIN") {
        navItems.push(
            { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/super-admin/agencies", label: "Agencies", icon: Briefcase }
        );
    } else if (role === "AGENCY_ADMIN") {
        navItems.push(
            { href: "/agency-admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/agency-admin/employees", label: "Team Members", icon: Users },
            { href: "/agency-admin/leads", label: "Leads", icon: UserCircle },
            { href: "/agency-admin/bookings", label: "Bookings", icon: ShoppingBag }
        );
    } else if (role === "AGENCY_EMPLOYEE") {
        navItems.push(
            { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
            { href: "/employee/leads", label: "My Leads", icon: UserCircle },
            { href: "/employee/bookings", label: "My Bookings", icon: ShoppingBag }
        );
    }

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                        T
                    </div>
                    <span className="text-xl text-white font-bold tracking-tight">TravelOS</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => {
                    const isRoot = item.href === "/super-admin" || item.href === "/agency-admin" || item.href === "/employee";
                    const isActive = isRoot ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600/10 text-blue-500'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
