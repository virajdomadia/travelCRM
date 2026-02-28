"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Employee {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
}

interface Props {
    employee: Employee | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeFormModal({ employee, onClose, onSuccess }: Props) {
    const isEditing = !!employee;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form fields
    const [email, setEmail] = useState(employee?.email || "");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isEditing ? `/api/agency/employees/${employee.id}` : `/api/agency/employees`;
            const method = isEditing ? "PUT" : "POST";

            const payload = isEditing
                ? { email }
                : { email, password, role: "AGENCY_EMPLOYEE" };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to save employee");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h3 className="text-xl font-semibold text-white">
                        {isEditing ? "Edit Employee" : "Add New Employee"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                            placeholder="colleague@agency.com"
                        />
                    </div>

                    {!isEditing && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                                placeholder="Min 8 characters"
                            />
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? "Save Changes" : "Create Employee")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
