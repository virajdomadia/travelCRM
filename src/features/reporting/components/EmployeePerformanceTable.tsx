"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, TrendingUp, Users, DollarSign } from "lucide-react";

export function EmployeePerformanceTable() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/agency/reports/employee-performance");
                if (!res.ok) throw new Error("Failed to fetch performance data");
                const result = await res.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-8 flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-500">
                <AlertCircle className="w-5 h-5" />
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-[#141b2d] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Employee Performance</h3>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Employee</th>
                            <th className="px-6 py-3 font-semibold text-center">Leads Handled</th>
                            <th className="px-6 py-3 font-semibold text-right">Revenue Closed</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{emp.email.split('@')[0]}</div>
                                    <div className="text-xs text-slate-500">{emp.email}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Users className="w-3 h-3 text-slate-500" />
                                        <span className="text-slate-300">{emp.leadsHandled}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-emerald-400 font-medium">
                                        <DollarSign className="w-3 h-3" />
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(emp.revenueClosed / 100)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
