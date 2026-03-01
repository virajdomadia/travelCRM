import { FollowUpList } from "@/features/reporting/components/FollowUpList";
import { Clock, Calendar } from "lucide-react";

export default function FollowUpsPage() {
    return (
        <div className="flex-1 space-y-8 p-8 bg-[#0a0f1e] min-h-screen">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Operations</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Follow-Up Schedule</h1>
                <p className="text-slate-400 text-sm">Manage your daily client interactions and tasks.</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between bg-slate-800/20 p-6 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                            <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Daily Priority</h2>
                            <p className="text-slate-500 text-sm">Leads scheduled for follow-up today or overdue.</p>
                        </div>
                    </div>
                </div>

                <FollowUpList />
            </div>
        </div>
    );
}
