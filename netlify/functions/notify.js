// netlify/functions/notify.js
import axios from 'axios';

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { recipientUserId, amount, senderName, title, message } = JSON.parse(event.body);
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
                url: 'https://stellarupi.netlify.app'
            },
        };

        console.log(`Sending OneSignal notification to: ${targetIds}`);
        const response = await axios.request(options);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: response.data })
        };
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error('OneSignal Notification Error:', errorData);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Notification delivery failed', details: errorData })
        };
    }
};
