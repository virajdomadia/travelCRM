/**
 * Format money stored in paise (or equivalent smallest currency unit) to a readable string.
 * @param {number} paise - Amount in smallest unit (e.g., paise, cents)
 * @param {string} currency - 3-letter currency code (e.g., "INR", "USD")
 * @returns {string} Formatted currency string
 */
export function formatMoney(paise: number, currency = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
    }).format(paise / 100);
}

/**
 * Calculates total cost, revenue, and profit for a set of line items.
 * All amounts are in paise.
 * @param items Array of line items with child cost and finalAmount
 * @returns totals object containing totalCost, totalRevenue, and profit
 */
export function calculateTotals(items: { cost: number; finalAmount: number }[]) {
    const totalCost = items.reduce((acc, item) => acc + item.cost, 0);
    const totalRevenue = items.reduce((acc, item) => acc + item.finalAmount, 0);
    const profit = totalRevenue - totalCost;

    return { totalCost, totalRevenue, profit };
}
