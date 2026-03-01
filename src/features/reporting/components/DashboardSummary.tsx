"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, TrendingUp, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { StatusCard } from "./StatusCard";

export function DashboardSummary() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSummary() {
            try {
                const res = await fetch("/api/agency/dashboard");
                if (!res.ok) throw new Error("Failed to fetch dashboard data");
                const summary = await res.json();
                setData(summary);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, []);

    if (error) {
        return (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-500">
                <AlertCircle className="w-5 h-5" />
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatusCard
                title="Total Leads"
                value={data?.totalLeads ?? 0}
                icon={Users}
                loading={loading}
            />
            <StatusCard
                title="Leads (Month)"
                value={data?.leadsThisMonth ?? 0}
                icon={Users}
                loading={loading}
                description="New leads this month"
            />
            <StatusCard
                title="Bookings (Month)"
                value={data?.bookingsThisMonth ?? 0}
                icon={Calendar}
                loading={loading}
                description="Converted to bookings"
            />
            <StatusCard
                title="Revenue (Month)"
                value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((data?.revenueThisMonth ?? 0) / 100)}
                icon={DollarSign}
                loading={loading}
                description="Total completions"
            />
            <StatusCard
                title="Conversion Rate"
                value={`${data?.conversionRate ?? 0}%`}
                icon={TrendingUp}
                loading={loading}
                description="Leads to Bookings"
            />
        </div>
    );
}
