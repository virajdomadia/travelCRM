import { useState, useEffect } from "react";
import { LeadStatus } from "@prisma/client";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, KanbanCardUI } from "./KanbanCard";

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

interface KanbanBoardProps {
    leads: Lead[];
    onLeadClick: (id: string) => void;
    onStatusChange: (leadId: string, newStatus: LeadStatus) => Promise<void>;
}

const COLUMNS: LeadStatus[] = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL,
    LeadStatus.WON,
    LeadStatus.LOST
];

export function KanbanBoard({ leads: initialLeads, onLeadClick, onStatusChange }: KanbanBoardProps) {
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [localLeads, setLocalLeads] = useState<Lead[]>(initialLeads);

    useEffect(() => {
        setLocalLeads(initialLeads);
    }, [initialLeads]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag distance before firing, allows clicks to pass through
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const currentActiveLead = localLeads.find((l) => l.id === active.id);
        if (currentActiveLead) {
            setActiveLead(currentActiveLead);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveALead = active.data.current?.type === "Lead";
        const isOverALead = over.data.current?.type === "Lead";
        const isOverAColumn = over.data.current?.type === "Column";

        if (!isActiveALead) return;

        // Dropping a lead over another lead (reordering within same column or moving to different column)
        if (isActiveALead && isOverALead) {
            setLocalLeads((prev) => {
                const activeIndex = prev.findIndex((l) => l.id === activeId);
                const overIndex = prev.findIndex((l) => l.id === overId);

                if (prev[activeIndex].status !== prev[overIndex].status) {
                    const newLeads = [...prev];
                    newLeads[activeIndex] = { ...newLeads[activeIndex], status: prev[overIndex].status };
                    return arrayMove(newLeads, activeIndex, overIndex);
                }

                return arrayMove(prev, activeIndex, overIndex);
            });
        }

        // Dropping a lead over an empty column
        if (isActiveALead && isOverAColumn) {
            setLocalLeads((prev) => {
                const activeIndex = prev.findIndex((l) => l.id === activeId);
                const newLeads = [...prev];
                newLeads[activeIndex] = { ...newLeads[activeIndex], status: overId as LeadStatus };
                return arrayMove(newLeads, activeIndex, activeIndex); // keeps it at same relative index, just changes status
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveLead(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Determine new status correctly from the drop target data
        // This avoids any stale closure mapping issues with localLeads state
        const isOverAColumn = over.data.current?.type === "Column";
        const isOverALead = over.data.current?.type === "Lead";

        let newStatus: LeadStatus | null = null;
        if (isOverAColumn) {
            newStatus = overId as LeadStatus;
        } else if (isOverALead) {
            newStatus = over.data.current?.lead?.status as LeadStatus;
        }

        if (!newStatus) return;

        // Compare with INITIAL data to ensure we actually changed columns
        const initialLead = initialLeads.find(l => l.id === activeId);

        // If status actually changed compared to initial data, trigger API update
        if (initialLead && initialLead.status !== newStatus) {
            try {
                // Keep local optimistic UI intact before server finishes
                setLocalLeads((prev) => {
                    const activeIndex = prev.findIndex((l) => l.id === activeId);
                    if (activeIndex === -1) return prev;
                    if (prev[activeIndex].status === newStatus) return prev; // already updated by onDragOver
                    const newLeads = [...prev];
                    newLeads[activeIndex] = { ...newLeads[activeIndex], status: newStatus as LeadStatus };
                    return newLeads;
                });

                await onStatusChange(activeId, newStatus);
            } catch (error) {
                // Revert to initial state on error
                console.error("Failed to update status", error);
                setLocalLeads(initialLeads);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[500px] w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {COLUMNS.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        leads={localLeads.filter((l) => l.status === status)}
                        onLeadClick={onLeadClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeLead ? (
                    <KanbanCardUI lead={activeLead} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
