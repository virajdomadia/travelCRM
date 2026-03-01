import { use } from "react";
import { BookingDetails } from "@/features/bookings/components/BookingDetails";

export default function EmployeeBookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <BookingDetails bookingId={id} />
        </div>
    );
}
