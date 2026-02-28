"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INPUT_CLASS =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all";
const LABEL_CLASS = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

const PLANS = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

interface AgencyDetail {
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
    users: { id: string; email: string; isActive: boolean; lastLoginAt: string | null }[];
}

export default function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [agency, setAgency] = useState<AgencyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        subscriptionPlan: "FREE",
        planLimitUsers: 5,
        planLimitLeads: 500,
    });

    useEffect(() => {
        fetch(`/api/super-admin/agencies/${id}`)
            .then((r) => r.json())
            .then((d) => {
                const a = d.agency;
                setAgency(a);
                setForm({
                    name: a.name,
                    email: a.email || "",
                    subscriptionPlan: a.subscriptionPlan,
                    planLimitUsers: a.planLimitUsers,
                    planLimitLeads: a.planLimitLeads,
                });
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveError("");
        setSaveSuccess(false);

        const res = await fetch(`/api/super-admin/agencies/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            setSaveSuccess(true);
            const d = await res.json();
            setAgency((prev) => prev ? { ...prev, ...d.agency } : prev);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            const d = await res.json();
            setSaveError(d.message || "Update failed.");
        }
        setSaving(false);
    };

    const handleToggle = async () => {
        if (!agency) return;
        setToggling(true);
        const res = await fetch(`/api/super-admin/agencies/${id}/toggle`, { method: "POST" });
        if (res.ok) {
            const d = await res.json();
            setAgency((prev) => prev ? { ...prev, isActive: d.isActive } : prev);
        }
        setToggling(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-4">Agency not found.</p>
                    <Link href="/super-admin/agencies" className="text-violet-400 hover:underline">← Back to Agencies</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a14] text-white p-8">
            <div className="max-w-3xl mx-auto">
                {/* Back */}
                <Link
                    href="/super-admin/agencies"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-8 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Agencies
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{agency.name}</h1>
                        <p className="text-slate-400 text-sm mt-1">{agency.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${agency.isActive ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${agency.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                            {agency.isActive ? "Active" : "Inactive"}
                        </span>
                        <button
                            id="toggle-agency-status"
                            onClick={handleToggle}
                            disabled={toggling}
                            className={`px-4 py-2 text-sm rounded-xl border font-medium transition-all disabled:opacity-50 ${agency.isActive
                                    ? "bg-red-950/50 border-red-900/50 hover:bg-red-900/50 text-red-400"
                                    : "bg-emerald-950/50 border-emerald-900/50 hover:bg-emerald-900/50 text-emerald-400"
                                }`}
                        >
                            {toggling ? "Updating..." : agency.isActive ? "Deactivate Agency" : "Activate Agency"}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "Total Users", value: `${agency._count.users} / ${agency.planLimitUsers}` },
                        { label: "Total Leads", value: `${agency._count.leads} / ${agency.planLimitLeads}` },
                        { label: "Plan", value: agency.subscriptionPlan },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                            <p className="text-lg font-semibold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSave} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5 mb-6">
                    <h2 className="text-sm font-semibold text-slate-300">Edit Agency Details</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Agency Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Agency Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Subscription Plan</label>
                        <div className="grid grid-cols-4 gap-2">
                            {PLANS.map((plan) => (
                                <button
                                    key={plan}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, subscriptionPlan: plan }))}
                                    className={`py-2 text-xs font-medium rounded-xl border transition-all ${form.subscriptionPlan === plan
                                            ? "bg-violet-600/30 border-violet-500/60 text-violet-300"
                                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                                        }`}
                                >
                                    {plan}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>User Limit</label>
                            <input
                                type="number"
                                min={1}
                                value={form.planLimitUsers}
                                onChange={(e) => setForm((f) => ({ ...f, planLimitUsers: Number(e.target.value) }))}
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Lead Limit</label>
                            <input
                                type="number"
                                min={1}
                                value={form.planLimitLeads}
                                onChange={(e) => setForm((f) => ({ ...f, planLimitLeads: Number(e.target.value) }))}
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {saveError && (
                        <p className="text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {saveError}
                        </p>
                    )}
                    {saveSuccess && (
                        <p className="text-emerald-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Changes saved successfully.
                        </p>
                    )}

                    <button
                        id="save-agency-changes"
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </form>

                {/* Admins List */}
                {agency.users.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-slate-300 mb-4">Agency Admins</h2>
                        <div className="space-y-3">
                            {agency.users.map((u) => (
                                <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-sm text-white">{u.email}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Last login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-md ${u.isActive ? "bg-emerald-900/30 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                                        {u.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
