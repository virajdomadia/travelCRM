import { DashboardSummary } from "@/features/reporting/components/DashboardSummary";
import { FollowUpList } from "@/features/reporting/components/FollowUpList";
import { EmployeePerformanceTable } from "@/features/reporting/components/EmployeePerformanceTable";
import { LayoutDashboard, TrendingUp, Clock } from "lucide-react";

export default function AgencyAdminDashboard() {
    return (
        <div className="flex-1 space-y-8 p-8 bg-[#0a0f1e] min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Agency Admin</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                <p className="text-slate-400 text-sm">Welcome back. Here's what's happening today.</p>
            </div>

            {/* Summary Metrics */}
            <DashboardSummary />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Performance & Reports */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Business Intelligence
                        </h2>
                    </div>
                    <EmployeePerformanceTable />
                </div>

                {/* Sidebar: Follow-ups */}
                <div className="space-y-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Action Center
                    </h2>
                    <FollowUpList />
                </div>
            </div>
        </div>
    );
}
