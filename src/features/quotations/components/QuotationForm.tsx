"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateQuotation } from '../hooks/useCreateQuotation';
import { LineItemsTable, LineItemFormState } from './LineItemsTable';
import { formatMoney } from '../utils/money';
import { QuotationWithItems } from '../types';
import { ConvertBookingButton } from './ConvertBookingButton';
import { FileText, Plus, History, Loader2, CheckCircle, ExternalLink } from 'lucide-react';

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
    const [existingQuotations, setExistingQuotations] = useState<QuotationWithItems[]>([]);
    const [loadingQuotations, setLoadingQuotations] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchQuotations = useCallback(async () => {
        setLoadingQuotations(true);
        try {
            const res = await fetch(`/api/agency/quotations?leadId=${leadId}`);
            if (res.ok) {
                const result = await res.json();
                setExistingQuotations(result.data || []);
                // If there are no quotations, auto-show the form
                if ((result.data || []).length === 0) {
                    setShowForm(true);
                }
            }
        } catch (err) {
            console.error("Failed to fetch quotations:", err);
        } finally {
            setLoadingQuotations(false);
        }
    }, [leadId]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

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

        const processedItems = items.map(i => ({
            name: i.name,
            cost: Math.round(parseFloat(i.costInput || '0') * 100),
            margin: Math.round(parseFloat(i.marginInput || '0') * 100),
            finalAmount: Math.round((parseFloat(i.costInput || '0') + parseFloat(i.marginInput || '0')) * 100)
        }));

        if (processedItems.some(i => i.name.trim() === '')) {
            alert("All line items must have a name");
            return;
        }

        try {
            await createQuotation({
                leadId,
                currency: 'INR',
                validUntil: validUntil ? new Date(validUntil) : undefined,
                totalAmount: calculateTotal(),
                lineItems: processedItems
            });
            setShowForm(false);
            fetchQuotations(); // Refresh list
        } catch (err: any) {
            // Handled in UI overlay
        }
    };

    const currentTotal = calculateTotal();

    return (
        <div className="space-y-6">
            {/* Header / Toggle Form */}
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Quotations</h3>
                        <p className="text-xs text-gray-500">Manage and track proposed travel plans</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showForm
                            ? "bg-gray-800 text-gray-400 hover:text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        }`}
                >
                    {showForm ? "Cancel" : <><Plus className="w-4 h-4" /> New Quotation</>}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Creation Form */}
            {showForm && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-400" />
                            Draft New Quote
                        </h4>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="validUntil" className="text-sm font-medium text-gray-400">Valid Until (Optional)</label>
                                <input
                                    type="date"
                                    id="validUntil"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-400">Line Items</label>
                            <LineItemsTable
                                items={items}
                                onChange={setItems}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-800 gap-4">
                            <div className="bg-gray-950 px-6 py-3 rounded-2xl border border-gray-800 text-center sm:text-left w-full sm:w-auto">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Quote Value</p>
                                <p className="text-2xl font-bold text-white">{formatMoney(currentTotal)}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                                    </span>
                                ) : 'Save Quotation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Existing Quotations List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h4 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Quotation History</h4>
                </div>

                {loadingQuotations ? (
                    <div className="flex justify-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800/50">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : existingQuotations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800/50 border-dashed">
                        <p className="text-gray-500 italic">No quotations drafted for this lead yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {existingQuotations.map((q) => (
                            <div
                                key={q.id}
                                className={`bg-gray-900 border ${q.status === 'APPROVED' ? 'border-green-500/30 bg-green-500/[0.02]' : 'border-gray-800'} rounded-2xl overflow-hidden transition-all hover:border-gray-700 p-5`}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${q.status === 'APPROVED' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                                    q.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                                        'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {q.status}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <History className="w-3 h-3" />
                                                Version {q.version}
                                            </span>
                                            <span className="text-xs text-gray-500">• {new Date(q.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-baseline gap-4">
                                            <span className="text-2xl font-black text-white">{formatMoney(q.totalAmount, q.currency)}</span>
                                            <span className="text-sm text-gray-500">{q.lineItems.length} line items</span>
                                        </div>

                                        {q.validUntil && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-950 w-fit px-3 py-1.5 rounded-lg border border-gray-800">
                                                Valid until: {new Date(q.validUntil).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 items-center md:items-end lg:items-center">
                                        {q.pdfUrl && (
                                            <a
                                                href={q.pdfUrl}
                                                target="_blank"
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium w-full sm:w-auto text-center justify-center"
                                            >
                                                <ExternalLink className="w-4 h-4" /> View PDF
                                            </a>
                                        )}

                                        {q.status === 'APPROVED' && (
                                            <ConvertBookingButton
                                                quotationId={q.id}
                                                onSuccess={() => fetchQuotations()}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
