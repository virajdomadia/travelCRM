"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Filter, Loader2, LayoutList, LayoutGrid } from "lucide-react";
import LeadFormModal from "./LeadFormModal";
import LeadDetailPanel from "./LeadDetailPanel";
import { KanbanBoard } from "./KanbanBoard";
import { LeadStatus } from "@prisma/client";

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: LeadStatus;
    assignedToId: string | null;
    createdAt: string;
    assignedTo?: { email: string } | null;
}

export function LeadList() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [employees, setEmployees] = useState<{ id: string, email: string }[]>([]);

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const assignedFilter = ""; // kept for API params, removing setter since it wasn't used in UI

    const [viewMode, setViewMode] = useState<"list" | "board">("board");

    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        try {
            setIsLoading(true);
            const paramsObj: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString(),
            };
            if (statusFilter) paramsObj.status = statusFilter;
            if (sourceFilter) paramsObj.source = sourceFilter;
            if (assignedFilter) paramsObj.assignedToId = assignedFilter;

            const params = new URLSearchParams(paramsObj);

            const res = await fetch(`/api/agency/leads?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeads(data.leads);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, statusFilter, sourceFilter, assignedFilter]);

    // Fetch employees once for dropdowns (Assignment logic)
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch("/api/agency/employees"); // Reusing employee route
                if (res.ok) {
                    const data = await res.json();
                    setEmployees(data);
                }
            } catch (error) {
                console.error("Failed to fetch employees", error);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
        try {
            const res = await fetch(`/api/agency/leads/${leadId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update status");
            }

            // Successfully updated on server, refresh leads
            fetchLeads();
        } catch (error) {
            console.error(error);
            // Throw error so KanbanBoard can revert optimistic UI
            throw error;
        }
    };

    return (
        <div className="w-full flex flex-col flex-1 min-w-0">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white">Lead Pipeline</h2>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">

                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
                        <Filter className="w-4 h-4 text-gray-500 ml-2" />
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-transparent text-sm text-gray-300 outline-none p-1 cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
                        <select
                            value={sourceFilter}
                            onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
                            className="bg-transparent text-sm text-gray-300 outline-none p-1 cursor-pointer pl-2"
                        >
                            <option value="">All Sources</option>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Cold Call">Cold Call</option>
                        </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
                            title="List View"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("board")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "board" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
                            title="Board View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add Lead Button */}
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-auto md:ml-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Lead</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20 border border-gray-800 bg-gray-900/50 rounded-xl">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : viewMode === "board" ? (
                <div className="w-full h-full">
                    <KanbanBoard
                        leads={leads}
                        onLeadClick={(id) => setViewingLeadId(id)}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            ) : (
                <div className="w-full overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/50">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-800/80 border-b border-gray-700">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-xl font-semibold tracking-wider">Name</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Contact</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Source</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Assigned</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                                <th className="px-6 py-4 rounded-tr-xl font-semibold tracking-wider text-right">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No leads found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setViewingLeadId(lead.id)}
                                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                                            {lead.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span>{lead.email || "-"}</span>
                                                <span className="text-xs text-gray-500">{lead.phone || ""}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.source || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.assignedTo?.email?.split('@')[0] || <span className="text-gray-600">Unassigned</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-gray-800 border border-gray-700 text-gray-300">
                                                {lead.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !isLoading && (
                <div className="flex justify-between items-center mt-6 text-sm">
                    <span className="text-gray-400">
                        Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg border border-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg border border-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modals & Panels */}
            {isFormOpen && (
                <LeadFormModal
                    lead={null}
                    employees={employees}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        fetchLeads();
                    }}
                />
            )}

            {viewingLeadId && (
                <LeadDetailPanel
                    leadId={viewingLeadId}
                    employees={employees}
                    onClose={() => setViewingLeadId(null)}
                    onUpdate={() => fetchLeads()}
                />
            )}

        </div>
    );
}
