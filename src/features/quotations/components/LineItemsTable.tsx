"use client";

import { useState, useEffect } from 'react';
import { formatMoney } from '../utils/money';

export type LineItemFormState = {
    id: string; // temp id for UI
    name: string;
    costInput: string; // treating user input as string initially to allow empty/decimals
    marginInput: string; // treating user input as string initially
};

type Props = {
    items: LineItemFormState[];
    onChange: (items: LineItemFormState[]) => void;
};

export function LineItemsTable({ items, onChange }: Props) {
    const handleAddRow = () => {
        onChange([
            ...items,
            { id: crypto.randomUUID(), name: '', costInput: '', marginInput: '' }
        ]);
    };

    const handleRemoveRow = (id: string) => {
        onChange(items.filter(item => item.id !== id));
    };

    const handleChange = (id: string, field: keyof LineItemFormState, value: string) => {
        onChange(
            items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const calculateRowTotal = (costStr: string, marginStr: string) => {
        const cost = parseFloat(costStr) || 0;
        const margin = parseFloat(marginStr) || 0;
        // We assume user types in major units (e.g. Rupees). Convert strictly for display.
        const totalPaise = Math.round((cost + margin) * 100);
        return formatMoney(totalPaise);
    };

    return (
        <div className="space-y-4">
            <table className="w-full text-sm text-left border">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 w-32">Cost</th>
                        <th className="px-4 py-3 w-32">Margin</th>
                        <th className="px-4 py-3 w-32 text-right">Total</th>
                        <th className="px-4 py-3 w-16"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                                <input
                                    type="text"
                                    placeholder="e.g. Flight Tickets"
                                    className="w-full p-2 border rounded text-gray-900"
                                    value={item.name}
                                    onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                                    required
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full p-2 border rounded text-gray-900"
                                    value={item.costInput}
                                    onChange={(e) => handleChange(item.id, 'costInput', e.target.value)}
                                    required
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full p-2 border rounded text-gray-900"
                                    value={item.marginInput}
                                    onChange={(e) => handleChange(item.id, 'marginInput', e.target.value)}
                                    required
                                />
                            </td>
                            <td className="p-2 text-right font-medium text-gray-900">
                                {calculateRowTotal(item.costInput, item.marginInput)}
                            </td>
                            <td className="p-2 text-center">
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRow(item.id)}
                                        className="text-red-600 hover:text-red-900 px-2 py-1 bg-red-50 rounded"
                                    >
                                        X
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button
                type="button"
                onClick={handleAddRow}
                className="text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded font-medium hover:bg-indigo-100 transition"
            >
                + Add Line Item
            </button>
        </div>
    );
}
