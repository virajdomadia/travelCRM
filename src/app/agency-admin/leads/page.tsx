import { LeadList } from "@/features/leads";

export const metadata = {
    title: "Leads | TravelOS",
    description: "Manage your agency's leads",
};

export default function LeadsPage() {
    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Leads</h1>
                <p className="text-gray-400">
                    Manage, assign, and track incoming leads across your agency.
                </p>
            </header>

            <LeadList />
        </div>
    );
}
