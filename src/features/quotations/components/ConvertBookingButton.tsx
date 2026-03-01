"use client";

import { useState } from "react";
import { ShoppingBag, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    quotationId: string;
    onSuccess?: (bookingId: string) => void;
}

export function ConvertBookingButton({ quotationId, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleConvert = async () => {
        if (!confirm("Are you sure you want to convert this quotation into a booking? This will update the lead status to BOOKED.")) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/agency/bookings/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quotationId })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to convert booking");
            }

            setSuccess(true);
            if (onSuccess) {
                onSuccess(data.booking.id);
            }

            // Redirect to the new booking after a short delay to show success state
            setTimeout(() => {
                router.push(`/agency-admin/bookings/${data.booking.id}`);
            }, 1500);

        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center gap-2 text-green-500 font-medium px-4 py-2 border border-green-500/30 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                Converted to Booking!
            </div>
        );
    }

    return (
        <button
            onClick={handleConvert}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <ShoppingBag className="w-4 h-4" />
            )}
            Convert to Booking
        </button>
    );
}
