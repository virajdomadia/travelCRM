"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Agency {
    id: string;
    name: string;
    email: string | null;
    isActive: boolean;
    subscriptionPlan: string;
    subscriptionEnds: string | null;
    planLimitUsers: number;
    planLimitLeads: number;
    createdAt: string;
    _count: { users: number; leads: number };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const PLAN_COLORS: Record<string, string> = {
    FREE: "bg-slate-700 text-slate-200",
    STARTER: "bg-blue-900/60 text-blue-300",
    PROFESSIONAL: "bg-purple-900/60 text-purple-300",
    ENTERPRISE: "bg-amber-900/60 text-amber-300",
};

export default function SuperAdminAgenciesPage() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchAgencies = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "12" });
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/super-admin/agencies?${params}`);
        const data = await res.json();
        setAgencies(data.agencies || []);
        setPagination(data.pagination || null);
        setLoading(false);
    }, [page, search, statusFilter]);

    useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

    // Debounce search
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setTogglingId(id);
        const res = await fetch(`/api/super-admin/agencies/${id}/toggle`, { method: "POST" });
        if (res.ok) {
            setAgencies((prev) =>
                prev.map((a) => (a.id === id ? { ...a, isActive: !currentStatus } : a))
            );
        }
        setTogglingId(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Agency Management
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {pagination ? `${pagination.total} agencies total` : "Loading..."}
                    </p>
                </div>
                <Link
                    href="/super-admin/agencies/new"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm transition-all shadow-lg shadow-violet-900/30"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Agency
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search agencies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-widest">
                                <th className="text-left px-6 py-4">Agency</th>
                                <th className="text-left px-6 py-4">Plan</th>
                                <th className="text-left px-6 py-4">Users</th>
                                <th className="text-left px-6 py-4">Leads</th>
                                <th className="text-left px-6 py-4">Status</th>
                                <th className="text-left px-6 py-4">Created</th>
                                <th className="text-right px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/5 animate-pulse">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-white/10 rounded-lg" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : agencies.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                        No agencies found.
                                    </td>
                                </tr>
                            ) : (
                                agencies.map((agency) => (
                                    <tr
                                        key={agency.id}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <Link href={`/super-admin/agencies/${agency.id}`} className="hover:text-violet-400 transition-colors">
                                                <div className="font-medium text-white">{agency.name}</div>
                                                <div className="text-slate-500 text-xs mt-0.5">{agency.email}</div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${PLAN_COLORS[agency.subscriptionPlan] || PLAN_COLORS.FREE}`}>
                                                {agency.subscriptionPlan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {agency._count.users}
                                            <span className="text-slate-600">/{agency.planLimitUsers}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {agency._count.leads}
                                            <span className="text-slate-600">/{agency.planLimitLeads}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${agency.isActive ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${agency.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                                                {agency.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(agency.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/super-admin/agencies/${agency.id}`}
                                                    className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleToggle(agency.id, agency.isActive)}
                                                    disabled={togglingId === agency.id}
                                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${agency.isActive
                                                        ? "bg-red-950/50 border-red-900/50 hover:bg-red-900/50 text-red-400"
                                                        : "bg-emerald-950/50 border-emerald-900/50 hover:bg-emerald-900/50 text-emerald-400"
                                                        }`}
                                                >
                                                    {togglingId === agency.id ? "..." : agency.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                        <span className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Prev
                            </button>
                            <button
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
