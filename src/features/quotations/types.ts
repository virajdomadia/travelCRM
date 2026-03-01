import { QuotationStatus } from '@prisma/client';

export type QuotationLineItemInput = {
    id?: string;
    name: string;
    cost: number; // in paise
    margin: number; // in paise
    finalAmount: number; // in paise
};

export type CreateQuotationInput = {
    leadId: string;
    totalAmount: number; // in paise
    totalCost?: number; // in paise
    totalRevenue?: number; // in paise
    profit?: number; // in paise
    currency?: string;
    validUntil?: Date;
    lineItems: QuotationLineItemInput[];
};

export type QuotationWithItems = {
    id: string;
    leadId: string;
    agencyId: string;
    version: number;
    isLatest: boolean;
    totalAmount: number;
    totalCost: number | null;
    totalRevenue: number | null;
    profit: number | null;
    currency: string;
    status: QuotationStatus;
    validUntil: Date | null;
    leadNameSnapshot: string | null;
    agencyNameSnapshot: string | null;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    lineItems: QuotationLineItem[];
};

export type QuotationLineItem = {
    id: string;
    quotationId: string;
    agencyId: string;
    name: string;
    cost: number;
    margin: number;
    finalAmount: number;
};
