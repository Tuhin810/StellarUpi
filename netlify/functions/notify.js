// api/notify.js (Node.js)
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { recipientUserId, amount, senderName, title, message } = req.body;
    const targetIds = Array.isArray(recipientUserId) ? recipientUserId : [recipientUserId];

    // targeting external_id via aliases is the modern approach for OneSignal v16+
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
            include_aliases: {
                external_id: targetIds
            },
            target_channel: "push",
            contents: { en: message || `You received ₹${amount} from ${senderName}!` },
            headings: { en: title || 'Money Received 💸' },
            url: 'https://stellar.netlify.app/history' // Updated to match your deploy URL
        },
    };

    try {
        console.log(`Sending OneSignal notification to: ${targetIds}`);
        const response = await axios.request(options);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error('OneSignal Notification Error:', errorData);
        res.status(500).json({ error: 'Notification delivery failed', details: errorData });
    }
}
