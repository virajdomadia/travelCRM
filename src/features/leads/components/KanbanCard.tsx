import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface KanbanCardUIProps {
    lead: Lead;
    onClick?: () => void;
    isDragging?: boolean;
    style?: React.CSSProperties;
    setNodeRef?: (node: HTMLElement | null) => void;
    attributes?: any;
    listeners?: any;
    isOverlay?: boolean;
}

export function KanbanCardUI({
    lead,
    onClick,
    isDragging,
    style,
    setNodeRef,
    attributes,
    listeners,
    isOverlay
}: KanbanCardUIProps) {
    if (isDragging && !isOverlay) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-40 border-2 border-blue-500/50 bg-gray-800/50 rounded-lg p-3 min-h-[100px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                if (e.defaultPrevented) return;
                onClick?.();
            }}
            className={`bg-gray-800 border rounded-lg p-3 transition-colors shadow-sm group ${isOverlay
                    ? "border-blue-500 cursor-grabbing shadow-2xl scale-105 rotate-2"
                    : "border-gray-700 hover:border-blue-500 cursor-grab active:cursor-grabbing"
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                    {lead.name}
                </h4>
            </div>
            {lead.email && <div className="text-xs text-gray-400 mb-1 truncate">{lead.email}</div>}

            <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500 max-w-[120px] truncate">
                    {lead.assignedTo?.email?.split('@')[0] || "Unassigned"}
                </span>
                {lead.source && (
                    <span className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-sm">
                        {lead.source}
                    </span>
                )}
            </div>
        </div>
    );
}

export function KanbanCard({ lead, onClick }: { lead: Lead; onClick?: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lead.id,
        data: {
            type: "Lead",
            lead,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <KanbanCardUI
            lead={lead}
            onClick={onClick}
            isDragging={isDragging}
            style={style}
            setNodeRef={setNodeRef}
            attributes={attributes}
            listeners={listeners}
        />
    );
}
