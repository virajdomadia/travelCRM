import { BookingList } from "@/features/bookings/components/BookingList";

export default function BookingsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Booking Manifest</h1>
                    <p className="text-gray-500 font-medium text-lg">Central hub for tracking all confirmed travel arrangements and payments.</p>
                </div>
            </div>

            <BookingList />
        </div>
    );
}
