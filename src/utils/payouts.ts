export interface PayoutResult {
    position: number;
    percentage: number;
    amount: number;
}

/**
 * Calculates the dynamic payout structure based on total entries and the prize pool.
 * Uses standard home game entry brackets:
 * 1-4: 1 paid (100%)
 * 5-10: 2 paid (65%, 35%)
 * 11-20: 3 paid (50%, 30%, 20%)
 * 21+: 4 paid (40%, 30%, 20%, 10%)
 */
export const calculatePayouts = (
    totalEntries: number,
    prizePool: number,
    rakePercentage: number = 0,
    customPayouts: number[] = []
): PayoutResult[] => {
    if (totalEntries <= 0 || prizePool <= 0) return [];

    // 1. Deduct Rake
    const netPrizePool = prizePool * (1 - (rakePercentage / 100));

    // 2. Determine Percentages
    let percentages: number[] = customPayouts;

    if (!percentages || percentages.length === 0) {
        if (totalEntries >= 1 && totalEntries <= 4) {
            percentages = [100];
        } else if (totalEntries >= 5 && totalEntries <= 10) {
            percentages = [65, 35];
        } else if (totalEntries >= 11 && totalEntries <= 20) {
            percentages = [50, 30, 20];
        } else {
            // 21+ entries
            percentages = [40, 30, 20, 10];
        }
    }

    // 3. Calculate Payouts
    return percentages.map((percentage, index) => {
        // Round payouts to whole numbers for cleaner display (optional)
        const amount = Math.round(netPrizePool * (percentage / 100));
        return {
            position: index + 1,
            percentage,
            amount,
        };
    });
};
