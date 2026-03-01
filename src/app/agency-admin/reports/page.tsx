import { DashboardSummary } from "@/features/reporting/components/DashboardSummary";
import { EmployeePerformanceTable } from "@/features/reporting/components/EmployeePerformanceTable";
import { TrendingUp, BarChart3, Users } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="flex-1 space-y-8 p-8 bg-[#0a0f1e] min-h-screen">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Detailed Reports</h1>
                <p className="text-slate-400 text-sm">Deep dive into your agency's performance and revenue.</p>
            </div>

            {/* Metrics Overview */}
            <DashboardSummary />

            <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Human Resources Performance
                    </h2>
                    <EmployeePerformanceTable />
                </div>

                {/* Note: Revenue Chart (BarChart) component will be added next in Phase 3 optimization */}
                <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-12 h-12 text-slate-700 mb-4" />
                    <h3 className="text-white font-medium">Revenue Trends</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm">
                        Advanced visualization for revenue trends is being optimized.
                        Check the dashboard for current month summary.
                    </p>
                </div>
            </div>
        </div>
    );
}
