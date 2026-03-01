import { calculateTotals } from '../utils/money';
import { QuotationRepository } from '../repositories/quotation.repository';
import { CreateQuotationInput, QuotationLineItemInput } from '../types';

export class QuotationService {
    /**
     * Calculates totals and persists a new Quotation version 
     */
    static async createQuotationVersion(
        agencyId: string,
        leadId: string,
        lineItems: QuotationLineItemInput[],
        validUntil?: Date,
        currency: string = "INR"
    ) {
        if (!lineItems || lineItems.length === 0) {
            throw new Error("Quotation must have at least one line item.");
        }

        // Server-side recalculation of money logic to ensure no tampering
        const cleanedLineItems = lineItems.map(item => ({
            name: item.name,
            cost: Math.round(item.cost),
            margin: Math.round(item.margin),
            finalAmount: Math.round(item.cost + item.margin) // Override frontend
        }));

        const totals = calculateTotals(cleanedLineItems);

        const inputData: CreateQuotationInput = {
            leadId,
            totalAmount: totals.totalRevenue,
            totalCost: totals.totalCost,
            totalRevenue: totals.totalRevenue,
            profit: totals.profit,
            currency,
            validUntil,
            lineItems: cleanedLineItems,
        };

        return await QuotationRepository.saveNewVersion(agencyId, inputData);
    }
}
