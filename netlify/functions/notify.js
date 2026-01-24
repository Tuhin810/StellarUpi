
const admin = require("firebase-admin");

// Initialize Firebase Admin (using environment variables for security)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, title, body, data } = JSON.parse(event.body);

    if (!token) {
      return { statusCode: 400, body: "Missing FCM Token" };
    }

    const message = {
      notification: { title, body },
      data: data || {},
      token: token,
    };

    const response = await admin.messaging().send(message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: response }),
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
