"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PLANS = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;

const INPUT_CLASS =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all";

const LABEL_CLASS = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

interface FormState {
    agencyName: string;
    agencyEmail: string;
    subscriptionPlan: typeof PLANS[number];
    adminEmail: string;
    adminPassword: string;
}

export default function NewAgencyPage() {
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        agencyName: "",
        agencyEmail: "",
        subscriptionPlan: "FREE",
        adminEmail: "",
        adminPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const set = (key: keyof FormState, value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => ({ ...e, [key]: "" }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.agencyName || form.agencyName.length < 2) errs.agencyName = "At least 2 characters required";
        if (!form.agencyEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.agencyEmail = "Valid email required";
        if (!form.adminEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.adminEmail = "Valid email required";
        if (form.adminPassword.length < 8) errs.adminPassword = "At least 8 characters";
        else if (!/[A-Z]/.test(form.adminPassword)) errs.adminPassword = "Must include an uppercase letter";
        else if (!/[0-9]/.test(form.adminPassword)) errs.adminPassword = "Must include a number";
        return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setServerError("");

        const res = await fetch("/api/super-admin/agencies/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            router.push(`/super-admin/agencies?created=${data.agency.name}`);
        } else if (res.status === 400 && data.errors) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of data.errors) {
                const field = issue.path?.[0] as string;
                if (field) fieldErrors[field] = issue.message;
            }
            setErrors(fieldErrors);
        } else {
            setServerError(data.message || "An unexpected error occurred.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Create New Agency
                </h1>
                <p className="text-slate-400 mt-2 text-sm">
                    An Agency Admin account will be automatically created and linked.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Agency Section */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">1</span>
                        Agency Details
                    </h2>

                    <div>
                        <label className={LABEL_CLASS}>Agency Name</label>
                        <input
                            id="agencyName"
                            type="text"
                            placeholder="Sunrise Travel Co."
                            value={form.agencyName}
                            onChange={(e) => set("agencyName", e.target.value)}
                            className={INPUT_CLASS}
                        />
                        {errors.agencyName && <p className="text-red-400 text-xs mt-1.5">{errors.agencyName}</p>}
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Agency Email</label>
                        <input
                            id="agencyEmail"
                            type="email"
                            placeholder="hello@sunrisetravel.com"
                            value={form.agencyEmail}
                            onChange={(e) => set("agencyEmail", e.target.value)}
                            className={INPUT_CLASS}
                        />
                        {errors.agencyEmail && <p className="text-red-400 text-xs mt-1.5">{errors.agencyEmail}</p>}
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Subscription Plan</label>
                        <div className="grid grid-cols-4 gap-2">
                            {PLANS.map((plan) => (
                                <button
                                    key={plan}
                                    type="button"
                                    onClick={() => set("subscriptionPlan", plan)}
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
                </div>

                {/* Admin Section */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-xs flex items-center justify-center font-bold">2</span>
                        Agency Admin Account
                    </h2>

                    <div>
                        <label className={LABEL_CLASS}>Admin Email</label>
                        <input
                            id="adminEmail"
                            type="email"
                            placeholder="admin@sunrisetravel.com"
                            value={form.adminEmail}
                            onChange={(e) => set("adminEmail", e.target.value)}
                            className={INPUT_CLASS}
                        />
                        {errors.adminEmail && <p className="text-red-400 text-xs mt-1.5">{errors.adminEmail}</p>}
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Admin Password</label>
                        <div className="relative">
                            <input
                                id="adminPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                                value={form.adminPassword}
                                onChange={(e) => set("adminPassword", e.target.value)}
                                className={`${INPUT_CLASS} pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                        {errors.adminPassword && <p className="text-red-400 text-xs mt-1.5">{errors.adminPassword}</p>}
                    </div>
                </div>

                {/* Error banner */}
                {serverError && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {serverError}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    id="submit-create-agency"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating Agency...
                        </>
                    ) : (
                        "Create Agency & Admin Account"
                    )}
                </button>
            </form>
        </div>
    );
}
