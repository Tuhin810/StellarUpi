
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
    const nextTen = Math.ceil(amount / 10) * 10;
    // If the amount is already a multiple of 10, we could either save 0 or round up to the next 10 (e.g. 150 -> 160).
    // Given the "Gamified" nature, rounding up to the NEXT 10 even if it's already a multiple 
    // ensures a saving happens on every transaction to maintain the streak.
    // However, usually "nearest 10" implies if it's 140, it stays 140 if we use Math.round, 
    // but the example 142 -> 150 shows it's always CEIL.
    // If 140 -> 140, then chillar is 0.
    const chillar = nextTen - amount;
    return chillar === 0 ? 10 : chillar; // Force at least 10 INR saving if it's already a multiple? 
    // User said "rounded up to the nearest ₹10". Let's use standard logic first.
};

export const getChillarDetails = (amount: number) => {
    const chillar = calculateChillarAmount(amount);
    return {
        originalAmount: amount,
        totalWithChillar: amount + chillar,
        chillarAmount: chillar
    };
};
