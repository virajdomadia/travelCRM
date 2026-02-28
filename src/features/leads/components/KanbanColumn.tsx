import { useDroppable } from "@dnd-kit/core";
import { LeadStatus } from "@prisma/client";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";

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

interface KanbanColumnProps {
    status: LeadStatus;
    leads: Lead[];
    onLeadClick: (id: string) => void;
}

const statusColors: Record<LeadStatus, string> = {
    NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CONTACTED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    QUALIFIED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    PROPOSAL: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    WON: "bg-green-500/10 text-green-400 border-green-500/20",
    LOST: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function KanbanColumn({ status, leads, onLeadClick }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: status,
        data: {
            type: "Column",
            status,
        },
    });

    return (
        <div className="flex flex-col bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden w-[300px] shrink-0 h-full max-h-[calc(100vh-220px)]">
            <div className={`px-4 py-3 border-b flex justify-between items-center ${statusColors[status]}`}>
                <h3 className="font-semibold text-sm tracking-wide uppercase">
                    {status.replace(/_/g, " ")}
                </h3>
                <span className="bg-gray-900/50 px-2 py-0.5 rounded-full text-xs font-medium">
                    {leads.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[150px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map(lead => (
                        <KanbanCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => onLeadClick(lead.id)}
                        />
                    ))}
                </SortableContext>
                {leads.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm border-2 border-dashed border-gray-800/50 rounded-lg p-6 text-center">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}
