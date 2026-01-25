
export interface Coupon {
    id: string;
    merchant: string;
    code: string;
    discount: string;
    desc: string;
    category: string;
    expiry: string;
    iconName: string;
    brandColor?: string;
    link?: string;
    source?: 'CouponAPI' | 'LiveFeed' | 'Fallback';
}

/**
 * StellPay Reward Engine
 * Dynamically switches between professional Coupon APIs and Live Feeds.
 */
export const fetchLiveCoupons = async (): Promise<{ coupons: Coupon[], lastUpdated: string }> => {
    // 1. Try LinkMyDeals API (as shown in user's documented screenshot)
    const API_KEY = "13152fac6dc542389c4b0421f94696c2";
    
    if (API_KEY) {
        try {
            // Updated to use the correct LinkMyDeals endpoint from your screenshot
            const res = await fetch(`https://feed.linkmydeals.com/getOffers/?API_Key=${API_KEY}&format=json`);
            const data = await res.json();
            
            // LinkMyDeals typically returns a list of offers
            if (data && data.offers) {
                return {
                    coupons: data.offers.map((o: any, i: number) => ({
                        id: o.lmd_id ?? `lmd-${i}`,
                        merchant: o.store || 'Merchant',
                        code: o.coupon_code || 'DEAL',
                        discount: o.offer_text?.match(/(\d+%\sOFF|₹\d+\sOFF|FREE)/i)?.[0] || 'HOT DEAL',
                        desc: o.offer_text || 'Exclusive Offer',
                        category: o.categories || 'Shopping',
                        expiry: o.expiry || 'Valid',
                        iconName: mapCategoryToIcon(o.categories),
                        brandColor: getBrandColor(o.store),
                        link: o.url,
                        source: 'CouponAPI'
                    })),
                    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }
        } catch (error) {
            console.error("LinkMyDeals API failed, falling back to Live Feed:", error);
        }
    }

    // 2. Fallback to DesiDime Live Feed (Actual Indian Deals, No Key Required)
    try {
        const RSS_FEED = 'https://www.desidime.com/feed';
        const JSON_FEED_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED)}`;
        
        const response = await fetch(JSON_FEED_API);
        const data = await response.json();

        if (data.status === 'ok') {
            return {
                coupons: data.items.map((item: any, index: number) => {
                    const title = item.title.toLowerCase();
                    const info = parseDealTitle(item.title);
                    
                    return {
                        id: `live-${index}`,
                        merchant: info.merchant,
                        code: extractCouponCode(item.content + item.title),
                        discount: info.discount,
                        desc: item.title,
                        category: info.category,
                        expiry: 'Verified Now',
                        iconName: info.iconName,
                        brandColor: info.brandColor,
                        link: item.link,
                        source: 'LiveFeed'
                    };
                }),
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
    } catch (err) {
        console.error("Live Feed Sync failed:", err);
    }

    // 3. Last Resort Fallback (Protocol Coded Deals)
    return {
        coupons: STATIC_FALLBACKS,
        lastUpdated: 'System Default'
    };
};

// --- Helper Functions for Data Extraction & UI ---

const mapCategoryToIcon = (cat: string = '') => {
    const c = cat.toLowerCase();
    if (c.includes('food') || c.includes('restaurant')) return 'Utensils';
    if (c.includes('grocery') || c.includes('supermarket')) return 'ShoppingBag';
    if (c.includes('travel') || c.includes('flight') || c.includes('cab')) return 'Car';
    if (c.includes('fashion') || c.includes('clothing')) return 'Fashion';
    return 'Ticket';
};

const getBrandColor = (store: string = '') => {
    const s = store.toLowerCase();
    if (s.includes('swiggy')) return 'from-orange-600 to-orange-400';
    if (s.includes('zomato')) return 'from-rose-600 to-rose-400';
    if (s.includes('uber') || s.includes('ola')) return 'from-zinc-800 via-zinc-900 to-black';
    if (s.includes('amazon')) return 'from-amber-500 to-orange-400';
    if (s.includes('zepto')) return 'from-purple-600 to-purple-400';
    if (s.includes('blinkit')) return 'from-yellow-500 to-yellow-400 text-black';
    if (s.includes('myntra') || s.includes('ajio')) return 'from-pink-500 to-rose-400';
    return 'from-emerald-600 to-emerald-400';
};

const parseDealTitle = (title: string) => {
    const t = title.toLowerCase();
    let merchant = 'Merchant';
    let category = 'Other';
    let iconName = 'Ticket';
    let discount = 'HOT DEAL';
    let brandColor = 'from-emerald-600 to-emerald-400';

    // Merchant Detection
    if (t.includes('swiggy')) { merchant = 'Swiggy'; brandColor = 'from-orange-600 to-orange-400'; }
    else if (t.includes('zomato')) { merchant = 'Zomato'; brandColor = 'from-rose-600 to-rose-400'; }
    else if (t.includes('amazon')) { merchant = 'Amazon'; brandColor = 'from-amber-500 to-orange-400'; }
    else if (t.includes('flipkart')) { merchant = 'Flipkart'; brandColor = 'from-blue-600 to-blue-400'; }
    else if (t.includes('myntra')) { merchant = 'Myntra'; brandColor = 'from-pink-500 to-rose-400'; }
    else if (t.includes('zepto')) { merchant = 'Zepto'; brandColor = 'from-purple-600 to-purple-400'; }
    else if (t.includes('blinkit')) { merchant = 'Blinkit'; brandColor = 'from-yellow-500 to-yellow-400 text-black'; }

    // Category Extraction
    if (t.includes('food') || t.includes('eat') || t.includes('restaurant')) {
        category = 'Food'; iconName = 'Utensils';
    } else if (t.includes('grocery') || t.includes('instamart') || t.includes('veggie')) {
        category = 'Groceries'; iconName = 'ShoppingBag';
    } else if (t.includes('travel') || t.includes('flight') || t.includes('hotel') || t.includes('cab')) {
        category = 'Travel'; iconName = 'Car';
    } else if (t.includes('fashion') || t.includes('shirt') || t.includes('shoe') || t.includes('clothes')) {
        category = 'Fashion'; iconName = 'Fashion';
    }

    // Discount Extraction
    const dMatch = title.match(/(\d+%\sOFF|₹\d+\sOFF|FREE)/i);
    if (dMatch) discount = dMatch[1].toUpperCase();

    return { merchant, category, iconName, discount, brandColor };
};

const extractCouponCode = (text: string) => {
    const codeMatch = text.match(/[Cc]ode\s?[:\-]?\s?([A-Z0-9]{4,15})/);
    return codeMatch ? codeMatch[1] : 'DEAL';
};

const STATIC_FALLBACKS: Coupon[] = [
    {
        id: 'fallback-1',
        merchant: "Zomato",
        code: "GET50",
        discount: "50% OFF",
        desc: "Up to ₹150 on your first food order",
        category: "Food",
        expiry: "Jan 2026",
        iconName: "Utensils",
        brandColor: "from-rose-600 to-rose-400",
        source: 'Fallback'
    },
    {
        id: 'fallback-2',
        merchant: "Swiggy",
        code: "TRYNEW",
        discount: "40% OFF",
        desc: "Up to ₹80 on select restaurants",
        category: "Food",
        expiry: "Jan 2026",
        iconName: "Utensils",
        brandColor: "from-orange-600 to-orange-400",
        source: 'Fallback'
    }
];
