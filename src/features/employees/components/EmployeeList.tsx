"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Power, PowerOff, Loader2 } from "lucide-react";
import EmployeeFormModal from "./EmployeeFormModal";

interface Employee {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
}

export function EmployeeList() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/agency/employees");
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/agency/employees/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (res.ok) {
                fetchEmployees(); // Refresh list
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Team Members</h2>
                <button
                    onClick={() => {
                        setEditingEmployee(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-800 border-b border-gray-700">
                        <tr>
                            <th className="px-6 py-4">Account</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Last Login</th>
                            <th className="px-6 py-4">Created Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No employees found. Add your first team member!
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{emp.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                            {emp.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleDateString() : "Never"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(emp.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setEditingEmployee(emp);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(emp.id, emp.isActive)}
                                                className={`p-1 transition-colors ${emp.isActive ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-emerald-400'}`}
                                                title={emp.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {emp.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <EmployeeFormModal
                    employee={editingEmployee}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchEmployees();
                    }}
                />
            )}
        </div>
    );
}
