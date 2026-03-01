import { getTenantPrisma } from "@/lib/tenant";
import { LeadStatus } from "@prisma/client";

export class ReportingRepository {
    private db;
    private agencyId;

    constructor(agencyId: string) {
        if (!agencyId) {
            throw new Error("FATAL: ReportingRepository instantiated without an agencyId.");
        }
        this.agencyId = agencyId;
        this.db = getTenantPrisma(agencyId);
    }

    async getDashboardSummary() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalLeads,
            leadsThisMonth,
            bookingsThisMonth,
            revenueThisMonth,
            totalBookings
        ] = await Promise.all([
            (this.db as any).lead.count({ where: { deletedAt: null } }),
            (this.db as any).lead.count({
                where: {
                    createdAt: { gte: firstDayOfMonth },
                    deletedAt: null
                }
            }),
            (this.db as any).booking.count({
                where: {
                    createdAt: { gte: firstDayOfMonth },
                    deletedAt: null
                }
            }),
            (this.db as any).payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    paymentDate: { gte: firstDayOfMonth }
                },
                _sum: {
                    paymentAmount: true
                }
            }),
            (this.db as any).booking.count({ where: { deletedAt: null } })
        ]);

        const conversionRate = totalLeads > 0
            ? Math.round((totalBookings / totalLeads) * 100)
            : 0;

        return {
            totalLeads,
            leadsThisMonth,
            bookingsThisMonth,
            revenueThisMonth: revenueThisMonth._sum.paymentAmount || 0,
            conversionRate
        };
    }

    async getRevenueReport(startDate?: Date, endDate?: Date) {
        const payments = await (this.db as any).payment.findMany({
            where: {
                status: 'COMPLETED',
                paymentDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                paymentAmount: true,
                paymentDate: true
            },
            orderBy: {
                paymentDate: 'asc'
            }
        });

        // Group by month
        const monthlyRevenue: Record<string, number> = {};
        payments.forEach((p: any) => {
            const month = p.paymentDate.toISOString().substring(0, 7); // YYYY-MM
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.paymentAmount;
        });

        return Object.entries(monthlyRevenue).map(([month, amount]) => ({
            month,
            amount
        }));
    }

    async getEmployeePerformance() {
        const employees = await (this.db as any).user.findMany({
            where: {
                agencyId: this.agencyId,
                role: 'AGENCY_EMPLOYEE',
                deletedAt: null
            },
            select: {
                id: true,
                email: true,
                assignedLeads: {
                    where: { deletedAt: null },
                    select: { id: true }
                },
                _count: {
                    select: {
                        assignedLeads: true
                    }
                }
            }
        });

        // For each employee, get revenue closed
        const performance = await Promise.all(employees.map(async (emp: any) => {
            const revenue = await (this.db as any).payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    booking: {
                        lead: {
                            assignedToId: emp.id
                        }
                    }
                },
                _sum: {
                    paymentAmount: true
                }
            });

            return {
                id: emp.id,
                email: emp.email,
                leadsHandled: emp._count.assignedLeads,
                revenueClosed: revenue._sum.paymentAmount || 0
            };
        }));

        return performance;
    }

    async getFollowUps() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const [todayFollowUps, overdueFollowUps] = await Promise.all([
            (this.db as any).lead.findMany({
                where: {
                    agencyId: this.agencyId,
                    followUpDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    deletedAt: null,
                    status: { notIn: [LeadStatus.WON, LeadStatus.LOST, LeadStatus.BOOKED] }
                },
                include: {
                    assignedTo: { select: { email: true } }
                }
            }),
            (this.db as any).lead.findMany({
                where: {
                    agencyId: this.agencyId,
                    followUpDate: {
                        lt: startOfDay
                    },
                    deletedAt: null,
                    status: { notIn: [LeadStatus.WON, LeadStatus.LOST, LeadStatus.BOOKED] }
                },
                include: {
                    assignedTo: { select: { email: true } }
                }
            })
        ]);

        return {
            today: todayFollowUps,
            overdue: overdueFollowUps
        };
    }
}
