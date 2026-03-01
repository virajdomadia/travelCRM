"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag,
    ArrowLeft,
    Calendar,
    User,
    Mail,
    FileText,
    Loader2,
    Briefcase,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import { PaymentTracking } from "./PaymentTracking";
import { formatMoney } from "@/features/quotations/utils/money";

interface Booking {
    id: string;
    title: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    lead: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    };
    quotation: {
        id: string;
        version: number;
        pdfUrl: string | null;
        lineItems: Array<{
            id: string;
            name: string;
            finalAmount: number;
        }>;
    };
}

export function BookingDetails({ bookingId }: { bookingId: string }) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBookingDetails = async () => {
        try {
            const res = await fetch(`/api/agency/bookings/${bookingId}`);
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 transition-all animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Retrieving booking manifest...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-24">
                <h3 className="text-2xl font-bold text-white mb-2">Booking not found</h3>
                <Link href="/agency-admin/bookings" className="text-blue-500 hover:underline">Back to bookings</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <Link
                        href="/agency-admin/bookings"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-4 w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Manifest
                    </Link>
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase">{booking.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(booking.createdAt).toLocaleDateString()}</span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/10 font-bold text-[10px] tracking-widest uppercase">ID: {booking.id.slice(0, 8)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Client & Quotation Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Client Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <User className="w-4 h-4" /> Client Manifest
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xl font-bold text-white mb-1">{booking.lead.name}</p>
                                <div className="space-y-2">
                                    {booking.lead.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Mail className="w-3.5 h-3.5" /> {booking.lead.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Link
                                href={`/agency-admin/leads`} // Ideally would deep link to the lead
                                className="flex items-center gap-2 w-full justify-center py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-all"
                            >
                                View Lead File
                            </Link>
                        </div>
                    </div>

                    {/* Quotation Reference */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <FileText className="w-16 h-16" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Source Quotation
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Version</span>
                                <span className="text-sm font-bold text-white">{booking.quotation.version}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <span className="text-sm text-gray-400">Status upon conversion</span>
                                <span className="text-[10px] font-bold uppercase py-1 px-2 bg-green-500/10 text-green-400 rounded-md">Approved</span>
                            </div>

                            <div className="pt-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Line Items Snapshot</h4>
                                <div className="space-y-2">
                                    {booking.quotation.lineItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400 truncate max-w-[150px]">{item.name}</span>
                                            <span className="font-semibold text-white">{formatMoney(item.finalAmount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {booking.quotation.pdfUrl && (
                                <a
                                    href={booking.quotation.pdfUrl}
                                    target="_blank"
                                    className="flex items-center gap-2 w-full justify-center py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-xl text-sm font-bold transition-all mt-4 border border-blue-500/10"
                                >
                                    <ExternalLink className="w-4 h-4" /> View Original PDF
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Payments */}
                <div className="lg:col-span-8">
                    <PaymentTracking
                        bookingId={booking.id}
                        totalAmount={booking.totalAmount}
                    />
                </div>
            </div>
        </div>
    );
}
