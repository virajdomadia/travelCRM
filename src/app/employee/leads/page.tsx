import { LeadList } from "@/features/leads";

export const metadata = {
    title: "My Leads | TravelOS",
    description: "Manage your assigned leads",
};

export default function EmployeeLeadsPage() {
    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Leads</h1>
                <p className="text-gray-400">
                    View and update the leads assigned to you.
                </p>
            </header>

            <LeadList />
        </div>
    );
}
