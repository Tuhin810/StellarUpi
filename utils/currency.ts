
export const getCurrencySymbol = (currency: string = 'INR') => {
    try {
        return (0).toLocaleString('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).replace(/\d/g, '').trim();
    } catch (e) {
        const symbols: Record<string, string> = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
        };
        return symbols[currency] || currency;
    }
};

export const formatFiat = (amount: number, currency: string = 'INR') => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return amount.toLocaleString(locale, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
};
