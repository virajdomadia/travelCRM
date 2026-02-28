import { EmployeeList } from "@/features/employees";

export default function EmployeesPage() {
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Employee Management</h1>
                <p className="text-gray-400">Manage your agency's team members.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl mt-6 p-6">
                <EmployeeList />
            </div>
        </div>
    );
}
