"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag,
    User,
    Calendar,
    ChevronRight,
    Loader2,
    Search,
    Filter,
    ArrowUpRight,
    CircleDollarSign
} from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/features/quotations/utils/money";

interface Booking {
    id: string;
    title: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    lead: {
        name: string;
        email: string | null;
    };
    quotation: {
        version: number;
    };
}

export function BookingList() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/agency/bookings"); // I'll need to create this generic GET route next
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.lead.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading your bookings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Total Bookings</span>
                    </div>
                    <div className="text-4xl font-black text-white">{bookings.length}</div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                            <CircleDollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Revenue (Paise)</span>
                    </div>
                    <div className="text-4xl font-black text-white">
                        {formatMoney(bookings.reduce((acc, b) => acc + b.totalAmount, 0))}
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-black/20 backdrop-blur-md py-4 rounded-2xl">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search bookings or clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List */}
            {filteredBookings.length === 0 ? (
                <div className="text-center py-24 bg-gray-900/20 rounded-3xl border border-gray-800 border-dashed">
                    <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No bookings found</h3>
                    <p className="text-gray-600">Start by converting an approved quotation to a booking.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredBookings.map((booking) => (
                        <Link
                            key={booking.id}
                            href={`/agency-admin/bookings/${booking.id}`}
                            className="group bg-gray-900 border border-gray-800 rounded-3xl p-6 transition-all hover:border-blue-500/50 hover:bg-gray-800/40 hover:shadow-2xl hover:shadow-blue-500/5"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                        {booking.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <User className="w-3.5 h-3.5" />
                                        {booking.lead.name}
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-blue-600 transition-colors">
                                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-gray-800/50">
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-1">Total Value</span>
                                    <span className="text-xl font-black text-white">{formatMoney(booking.totalAmount, booking.currency)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-1">Created Date</span>
                                    <span className="text-sm font-semibold text-gray-300 flex items-center justify-end gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                        {new Date(booking.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
