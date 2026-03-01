"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Globe, TrendingUp, DollarSign, Activity } from "lucide-react";
import { StatusCard } from "@/features/reporting/components/StatusCard";

export default function SuperAdminPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/super-admin/dashboard");
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch global stats", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="flex-1 space-y-8 p-8 bg-[#0a0f1e] min-h-screen">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-violet-400 font-medium text-sm">
                    <Globe className="w-4 h-4" />
                    <span>Global Platform Control</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Platform Overview</h1>
                <p className="text-slate-400 text-sm">Real-time aggregated metrics across all agency tenants.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatusCard
                    title="Total Agencies"
                    value={stats?.totalAgencies ?? 0}
                    icon={Building2}
                    loading={loading}
                />
                <StatusCard
                    title="Active Agencies"
                    value={stats?.activeAgencies ?? 0}
                    icon={Activity}
                    loading={loading}
                    trend={{ value: stats?.totalAgencies ? Math.round((stats.activeAgencies / stats.totalAgencies) * 100) : 0, isPositive: true }}
                />
                <StatusCard
                    title="Platform Leads"
                    value={stats?.platformLeads ?? 0}
                    icon={Users}
                    loading={loading}
                    description="Total across all tenants"
                />
                <StatusCard
                    title="Platform Bookings"
                    value={stats?.platformBookings ?? 0}
                    icon={TrendingUp}
                    loading={loading}
                />
                <StatusCard
                    title="Platform Revenue"
                    value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((stats?.platformRevenue ?? 0) / 100)}
                    icon={DollarSign}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#141b2d] border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Tenant Distribution</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs">
                            Manage individual agencies, subscriptions, and security settings.
                        </p>
                    </div>
                    <a href="/super-admin/agencies" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all">
                        Manage Agencies
                    </a>
                </div>

                <div className="bg-[#141b2d] border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">System Audit Logs</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs">
                            Monitor platform-wide activity and security events.
                        </p>
                    </div>
                    <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700">
                        View System Logs
                    </button>
                </div>
            </div>
        </div>
    );
}
