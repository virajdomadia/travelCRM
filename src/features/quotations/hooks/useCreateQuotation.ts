"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateQuotationInput } from '../types';

export function useCreateQuotation(leadId: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const createQuotation = async (data: CreateQuotationInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/agency/quotations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...data, leadId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create quotation');
            }

            const result = await response.json();
            router.refresh();
            return result.data;
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createQuotation,
        isLoading,
        error,
    };
}
