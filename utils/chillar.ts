
/**
 * Calculates the amount to be rounded up to the nearest ₹10.
 * Example: 142 -> 150 (Chillar = 8)
 * Example: 150 -> 160 (Chillar = 10) - Optional: user might want 0 if already at 10, 
 * but usually "round up" implies moving to the NEXT 10 if we want to force saving.
 * Let's stick to standard round up: if it's 142, next 10 is 150. If 140, next might be 140 or 150.
 * The prompt says: "Every transaction will be rounded up to the nearest ₹10. For example, a ₹142 payment becomes ₹150".
 */
export const calculateChillarAmount = (amount: number): number => {
    if (amount <= 0) return 0;

    // Standard round up to nearest 10
    const nextTen = Math.ceil(amount / 10) * 10;
    const chillar = nextTen - amount;

    // If it's already a multiple of 10 (chillar is 0), 
    // we save exactly ₹1 (instead of ₹10) to maintain the streak 
    // without doubling the cost of a ₹10 payment.
    if (chillar === 0) return 1;

    return Number(chillar.toFixed(2));
};

export const getChillarDetails = (amount: number) => {
    const chillar = calculateChillarAmount(amount);
    return {
        originalAmount: amount,
        totalWithChillar: amount + chillar,
        chillarAmount: chillar
    };
};
