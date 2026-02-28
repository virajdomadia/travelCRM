"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Lead {
    id?: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
    assignedToId?: string | null;
}

interface Props {
    lead: Lead | null; // null for new lead
    employees: { id: string, email: string }[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function LeadFormModal({ lead, employees, onClose, onSuccess }: Props) {
    const isEditing = !!lead && !!lead.id;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const defaultAssignedToId = employees.length === 1 ? employees[0].id : "";

    const [formData, setFormData] = useState({
        name: lead?.name || "",
        email: lead?.email || "",
        phone: lead?.phone || "",
        source: lead?.source || "",
        assignedToId: lead?.assignedToId || defaultAssignedToId,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isEditing ? `/api/agency/leads/${lead.id}` : `/api/agency/leads`;
            const method = isEditing ? "PUT" : "POST";

            // cleanup empty strings
            const payload = {
                ...formData,
                email: formData.email || null,
                phone: formData.phone || null,
                source: formData.source || null,
                assignedToId: formData.assignedToId || null,
            };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to save lead");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h3 className="text-xl font-semibold text-white">
                        {isEditing ? "Edit Lead" : "Add New Lead"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Lead Name *</label>
                        <input
                            type="text" name="name" required value={formData.name} onChange={handleChange}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                type="email" name="email" value={formData.email} onChange={handleChange}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                            <input
                                type="text" name="phone" value={formData.phone} onChange={handleChange}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Source</label>
                            <select
                                name="source" value={formData.source} onChange={handleChange}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select source</option>
                                <option value="Website">Website</option>
                                <option value="Referral">Referral</option>
                                <option value="Social Media">Social Media</option>
                                <option value="Cold Call">Cold Call</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Only AGENCY_ADMIN typically assigns on creation, but UI allows it if employees are passed */}
                        {employees.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                                <select
                                    name="assignedToId" value={formData.assignedToId} onChange={handleChange}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Unassigned</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.email}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[120px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? "Save Changes" : "Create Lead")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
