import Link from "next/link";
import { AlertTriangle, CreditCard, Mail } from "lucide-react";

export default function SubscriptionExpiredPage() {
    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#141b2d] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">Subscription Expired</h1>
                    <p className="text-slate-400 text-sm">
                        Your agency's access has been limited because your subscription period has ended.
                    </p>
                </div>

                <div className="bg-slate-800/30 rounded-2xl p-6 space-y-4 border border-slate-800">
                    <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-semibold">Renew Plan</p>
                            <p className="text-slate-500 text-xs">Unlock all features instantly.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                        View Pricing Plans
                    </button>
                    <Link
                        href="mailto:support@travelos.com"
                        className="w-full py-3 px-4 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </Link>
                </div>

                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                    TravelOS Platform Control
                </p>
            </div>
        </div>
    );
}
