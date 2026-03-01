"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    History,
    IndianRupee,
    Calendar,
    ArrowDownLeft
} from "lucide-react";
import { formatMoney } from "@/features/quotations/utils/money";

interface Payment {
    id: string;
    paymentAmount: number;
    paymentDate: string;
    status: string;
}

interface Props {
    bookingId: string;
    totalAmount: number;
}

export function PaymentTracking({ bookingId, totalAmount }: Props) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState("COMPLETED");
    const [submitting, setSubmitting] = useState(false);

    const fetchPayments = async () => {
        try {
            const res = await fetch(`/api/agency/payments?bookingId=${bookingId}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [bookingId]);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/agency/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    paymentAmount: Math.round(parseFloat(amount) * 100),
                    paymentDate: date,
                    status
                })
            });

            if (res.ok) {
                setAmount("");
                setShowForm(false);
                fetchPayments();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const paidAmount = payments.reduce((acc, p) => acc + p.paymentAmount, 0);
    const remainingAmount = totalAmount - paidAmount;
    const progressPercentage = Math.min((paidAmount / totalAmount) * 100, 100);

    return (
        <div className="space-y-6">
            {/* Payment Summary Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <IndianRupee className="w-32 h-32" />
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Payment Status</h3>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-black text-white">{formatMoney(paidAmount)}</span>
                                <span className="text-sm text-gray-500 font-medium pb-1">
                                    of {formatMoney(totalAmount)}
                                </span>
                            </div>
                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${remainingAmount <= 0 ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-blue-600'}`}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <p className="text-sm font-medium">
                                {remainingAmount <= 0 ? (
                                    <span className="text-green-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Fully Paid
                                    </span>
                                ) : (
                                    <span className="text-blue-400">{formatMoney(remainingAmount)} Remaining</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-xl"
                        >
                            {showForm ? "Cancel" : <><Plus className="w-5 h-5" /> Log Payment</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Payment Form */}
            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 animate-in slide-in-from-top-4 duration-300">
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        Enter Payment Details
                    </h4>
                    <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Amount (INR)</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-500 [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Action</label>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold h-[48px] rounded-xl transition-all shadow-lg shadow-green-600/20"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm & Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Payment History List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Transaction History</h4>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900/10 border border-gray-800 border-dashed rounded-3xl text-gray-500 italic">
                        No payments logged yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map(p => (
                            <div key={p.id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex justify-between items-center transition-all hover:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl scale-90 ${p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        <ArrowDownLeft className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white">{formatMoney(p.paymentAmount)}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(p.paymentDate).toLocaleDateString()}
                                            <span className={`px-1.5 py-0.5 rounded-md ${p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-gray-600">ID: {p.id.slice(-8)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
