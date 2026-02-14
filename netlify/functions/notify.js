// netlify/functions/notify.js

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

        console.log(`Sending OneSignal notification to: ${targetIds}`);

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
                app_id: process.env.VITE_ONESIGNAL_APP_ID,
                include_aliases: {
                    external_id: targetIds
                },
                target_channel: "push",
                contents: { en: message || `You received ₹${amount} from ${senderName}!` },
                headings: { en: title || 'Money Received 💸' },
                url: 'https://stellarupi.netlify.app'
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data })
        };
    } catch (error) {
        console.error('OneSignal Notification Error:', error.message);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Notification delivery failed', details: error.message })
        };
    }
};
