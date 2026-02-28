"use client";

import { useState, useEffect } from "react";
import { X, Calendar, User, AlignLeft, Send, Loader2 } from "lucide-react";
import { LeadStatus } from "@prisma/client";

interface LeadNote {
    id: string;
    content: string;
    createdAt: string;
    createdBy: { email: string };
}

interface LeadData {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: LeadStatus;
    followUpDate: string | null;
    assignedToId: string | null;
    createdAt: string;
    updatedAt: string;
    notes: LeadNote[];
}

interface Props {
    leadId: string;
    employees: { id: string, email: string }[];
    onClose: () => void;
    onUpdate: () => void; // Triggered when data changes so parent list can refresh
}

export default function LeadDetailPanel({ leadId, employees, onClose, onUpdate }: Props) {
    const [lead, setLead] = useState<LeadData | null>(null);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState("");
    const [addingNote, setAddingNote] = useState(false);

    const fetchLeadDetails = async () => {
        try {
            const res = await fetch(`/api/agency/leads/${leadId}`);
            if (res.ok) {
                const data = await res.json();
                setLead(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeadDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId]);

    const handleStatusChange = async (newStatus: LeadStatus) => {
        if (!lead) return;
        try {
            const res = await fetch(`/api/agency/leads/${lead.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setLead({ ...lead, status: newStatus });
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssign = async (employeeId: string) => {
        if (!lead) return;
        try {
            const res = await fetch(`/api/agency/leads/${lead.id}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assignedToId: employeeId || null })
            });
            if (res.ok) {
                setLead({ ...lead, assignedToId: employeeId || null });
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !lead) return;

        setAddingNote(true);
        try {
            const res = await fetch(`/api/agency/leads/${lead.id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newNote })
            });

            if (res.ok) {
                setNewNote("");
                fetchLeadDetails(); // refresh notes list
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAddingNote(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[50] flex justify-end bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 h-full flex items-center justify-center shadow-2xl animate-in slide-in-from-right duration-300">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-[50] flex justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-950 border-l border-gray-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-800 bg-gray-900">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{lead.name}</h2>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            {lead.email && <span>{lead.email}</span>}
                            {lead.phone && <span>• {lead.phone}</span>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Quick Actions / Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Status</label>
                            <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                                className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                            </select>
                        </div>

                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Agent</label>
                            <select
                                value={lead.assignedToId || ""}
                                onChange={(e) => handleAssign(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Unassigned</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.email}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date Created</span>
                            <span className="text-sm text-gray-200 ml-6">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                        {lead.followUpDate && (
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Follow Up</span>
                                <span className="text-sm text-blue-400 font-medium ml-6">{new Date(lead.followUpDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {lead.source && (
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><AlignLeft className="w-4 h-4" /> Source</span>
                                <span className="text-sm text-gray-200 ml-6">{lead.source}</span>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <AlignLeft className="w-5 h-5 text-gray-400" />
                            Activity & Notes
                        </h3>

                        <form onSubmit={handleAddNote} className="mb-6 relative">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Write a note..."
                                required
                                className="w-full bg-gray-900 border border-gray-800 text-sm text-white rounded-xl px-4 py-3 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600 resize-none"
                            />
                            <button
                                type="submit"
                                disabled={addingNote || !newNote.trim()}
                                className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                            >
                                {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>

                        <div className="space-y-4">
                            {lead.notes.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No notes yet.</p>
                            ) : (
                                lead.notes.map(note => (
                                    <div key={note.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                                                <User className="w-3 h-3" />
                                                {note.createdBy.email.split('@')[0]}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
