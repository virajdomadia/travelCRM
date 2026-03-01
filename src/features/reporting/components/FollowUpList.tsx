"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle, ChevronRight, User } from "lucide-react";
import Link from "next/link";

export function FollowUpList() {
    const [data, setData] = useState<{ today: any[], overdue: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFollowUps() {
            try {
                const res = await fetch("/api/agency/leads/follow-ups");
                if (!res.ok) throw new Error("Failed to fetch follow-ups");
                const result = await res.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchFollowUps();
    }, []);

    if (loading) {
        return (
            <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-6 animate-pulse">
                <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) return null;

    const hasFollowUps = (data?.today.length ?? 0) > 0 || (data?.overdue.length ?? 0) > 0;

    if (!hasFollowUps) {
        return (
            <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-slate-500" />
                </div>
                <h3 className="text-white font-medium">All caught up!</h3>
                <p className="text-slate-400 text-sm mt-1">No follow-ups scheduled for today or overdue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overdue */}
            {data!.overdue.length > 0 && (
                <div className="bg-[#141b2d] border border-rose-500/20 rounded-xl overflow-hidden">
                    <div className="bg-rose-500/10 px-6 py-3 flex items-center gap-2 border-b border-rose-500/20">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <h3 className="text-rose-500 font-bold text-sm uppercase tracking-wider">Overdue Follow-ups</h3>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {data!.overdue.map(lead => (
                            <FollowUpItem key={lead.id} lead={lead} isOverdue />
                        ))}
                    </div>
                </div>
            )}

            {/* Today */}
            {data!.today.length > 0 && (
                <div className="bg-[#141b2d] border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 flex items-center gap-2 border-b border-slate-800">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Today's Schedule</h3>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {data!.today.map(lead => (
                            <FollowUpItem key={lead.id} lead={lead} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function FollowUpItem({ lead, isOverdue }: { lead: any, isOverdue?: boolean }) {
    return (
        <div className="px-6 py-4 flex items-center justify-between group hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-blue-400'}`} />
                <div>
                    <h4 className="text-white font-medium">{lead.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{lead.source || 'No source'}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            <User className="w-3 h-3" />
                            {lead.assignedTo?.email?.split('@')[0] || 'Unassigned'}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className={`text-xs ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                    {new Date(lead.followUpDate).toLocaleDateString()}
                </span>
                <Link
                    href={`/agency-admin/leads?id=${lead.id}`}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
            </div>
        </div>
    );
}
