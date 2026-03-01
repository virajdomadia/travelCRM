"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateQuotation } from '../hooks/useCreateQuotation';
import { LineItemsTable, LineItemFormState } from './LineItemsTable';
import { formatMoney } from '../utils/money';

type Props = {
    leadId: string;
};

export function QuotationForm({ leadId }: Props) {
    const router = useRouter();
    const { createQuotation, isLoading, error } = useCreateQuotation(leadId);

    const [items, setItems] = useState<LineItemFormState[]>([
        { id: crypto.randomUUID(), name: '', costInput: '', marginInput: '' }
    ]);
    const [validUntil, setValidUntil] = useState('');

    const calculateTotal = () => {
        let rawTotalPaise = 0;
        items.forEach(item => {
            const cost = parseFloat(item.costInput) || 0;
            const margin = parseFloat(item.marginInput) || 0;
            rawTotalPaise += Math.round((cost + margin) * 100);
        });
        return rawTotalPaise;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert string inputs to pure integers for API
        // 1 Major unit (e.g INR) = 100 Minor units (e.g Paise)
        const processedItems = items.map(i => ({
            name: i.name,
            cost: Math.round(parseFloat(i.costInput || '0') * 100),
            margin: Math.round(parseFloat(i.marginInput || '0') * 100),
            finalAmount: Math.round((parseFloat(i.costInput || '0') + parseFloat(i.marginInput || '0')) * 100)
        }));

        // Enforce 0 margin if not supplied, but validate at least a name and cost
        if (processedItems.some(i => i.name.trim() === '')) {
            alert("All line items must have a name");
            return;
        }

        try {
            await createQuotation({
                leadId,
                currency: 'INR',
                validUntil: validUntil ? new Date(validUntil) : undefined,
                totalAmount: calculateTotal(), // Will be re-verified server side
                lineItems: processedItems
            });
            alert('Quotation Created Successfully!');
            router.push(`/leads/${leadId}`); // Redirect or handle closing modal
        } catch (err: any) {
            // Handled in UI overlay
        }
    };

    const currentTotal = calculateTotal();

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Create Quotation</h3>
                {error && <span className="text-sm text-red-600">{error}</span>}
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">Valid Until (Optional)</label>
                        <input
                            type="date"
                            id="validUntil"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
                    <LineItemsTable
                        items={items}
                        onChange={setItems}
                    />
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-6">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Quotation Value</p>
                            <p className="text-2xl font-bold text-gray-900">{formatMoney(currentTotal)}</p>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Generating Version...' : 'Save Quotation'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
