const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered when a new transaction is created.
 * Sends a push notification to the recipient.
 */
exports.notifyPayment = onDocumentCreated("transactions/{id}", async (event) => {
    const tx = event.data.data();
    const recipientStellarId = tx.toId;
    const amount = tx.amount;
    const senderName = tx.fromName || tx.fromId.split('@')[0];

    try {
        // 1. Find the recipient's FCM token
        // Use query because uid is not stellarId
        const userSnapshot = await admin.firestore()
            .collection("upiAccounts")
            .where("stellarId", "==", recipientStellarId)
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            console.log(`No user found for StellarId: ${recipientStellarId}`);
            return;
        }

        const userData = userSnapshot.docs[0].data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken || !userData.notificationsEnabled) {
            console.log(`User ${recipientStellarId} has no token or notifications disabled.`);
            return;
        }

        // 2. Send the push notification
        const message = {
            notification: {
                title: "Payment Received! 💰",
                body: `You received ₹${amount} from ${senderName}`,
            },
            data: {
                type: "payment",
                transactionId: event.params.id,
                amount: amount.toString(),
            },
            token: fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent payment notification:", response);
    } catch (error) {
        console.error("Error sending payment notification:", error);
    }
});

/**
 * Triggered when a new split expense is created.
 * Sends push notifications to all participants except the payer.
 */
exports.notifySplit = onDocumentCreated("splitExpenses/{id}", async (event) => {
    const expense = event.data.data();
    const groupId = expense.groupId;
    const description = expense.description;
    const totalAmount = expense.totalAmount;
    const payerStellarId = expense.paidBy;

    try {
        // 1. Get Group details to get the name
        const groupDoc = await admin.firestore().collection("groups").doc(groupId).get();
        if (!groupDoc.exists) {
            console.log(`Group not found: ${groupId}`);
            return;
        }
        const groupName = groupDoc.data().name;

        // 2. Identify participants who need a notification (everyone except the payer)
        const participantsToNotify = expense.participants
            .filter(p => p.stellarId !== payerStellarId)
            .map(p => p.stellarId);

        if (participantsToNotify.length === 0) return;

        // 3. Look up FCM tokens for all participants
        const userSnapshots = await admin.firestore()
            .collection("upiAccounts")
            .where("stellarId", "in", participantsToNotify)
            .get();

        const messages = [];
        userSnapshots.forEach(doc => {
            const userData = doc.data();
            if (userData.fcmToken && userData.notificationsEnabled) {
                messages.push({
                    notification: {
                        title: `New Split in ${groupName} 👥`,
                        body: `${description}: Total ₹${totalAmount} split by ${payerStellarId.split('@')[0]}`,
                    },
                    data: {
                        type: "split",
                        groupId: groupId,
                        expenseId: event.params.id,
                    },
                    token: userData.fcmToken,
                });
            }
        });

        if (messages.length === 0) return;

        // 4. Send all notifications
        const response = await admin.messaging().sendEach(messages);
        console.log(`Sent ${response.successCount} split notifications successfully.`);
    } catch (error) {
        console.error("Error sending split notifications:", error);
    }
});
