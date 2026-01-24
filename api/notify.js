// api/notify.js (Node.js)
import axios from 'axios';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Get transaction details from the request
    const { recipientUserId, amount, senderName, title, message } = req.body;

    // Convert to array if it's a single string
    const targetIds = Array.isArray(recipientUserId) ? recipientUserId : [recipientUserId];

    // 2. Send to OneSignal
    const options = {
        method: 'POST',
        url: 'https://onesignal.com/api/v1/notifications',
        headers: {
            accept: 'application/json',
            Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
            'content-type': 'application/json',
        },
        data: {
            app_id: process.env.VITE_ONESIGNAL_APP_ID,
            include_external_user_ids: targetIds,
            contents: { en: message || `You received ₹${amount} from ${senderName}!` },
            headings: { en: title || 'Money Received 💸' },
            url: 'https://stellar-pay.vercel.app/history'
        },
    };

    try {
        const response = await axios.request(options);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('OneSignal Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message, details: error.response ? error.response.data : {} });
    }
}
