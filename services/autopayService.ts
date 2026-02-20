
import { getUserSubscriptions, recordTransaction, updatePersonalSpend, getUserById, getProfile } from './db';
import { sendPayment, getBalance } from './stellar';
import { decryptSecret } from './encryption';
import { UserProfile, UserSubscription } from '../types';
import { NotificationService } from './notification';

export class AutopayService {
    private static intervalId: any = null;
    private static currentProfileId: string | null = null;

    static start(profile: UserProfile) {
        // If profile changed, stop and restart
        if (this.currentProfileId && this.currentProfileId !== profile.uid) {
            this.stop();
        }

        if (this.intervalId) return;

        this.currentProfileId = profile.uid;
        console.log("🚀 Autopay Worker Started for", profile.stellarId);

        // Run once immediately
        this.processDueSubscriptions(profile);

        // Then every 30 seconds for responsiveness
        this.intervalId = setInterval(() => {
            this.processDueSubscriptions(profile);
        }, 30000);
    }

    static stop() {
        if (this.intervalId) {
            console.log("🛑 Autopay Worker Stopped");
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.currentProfileId = null;
        }
    }

    private static async processDueSubscriptions(profile: UserProfile) {
        try {
            console.log(`🔍 Checking subscriptions for ${profile.stellarId}...`);

            // ALWAYS fetch the freshest profile from DB to avoid staleness
            const freshProfile = await getProfile(profile.uid);
            if (!freshProfile) {
                console.error("❌ AutoPay failed: Could not refresh profile from DB");
                return;
            }

            const subscriptions = await getUserSubscriptions(freshProfile.uid);
            const now = new Date();

            if (subscriptions.length === 0) {
                console.log("ℹ️ No active subscriptions found.");
                return;
            }

            for (const sub of subscriptions) {
                if (sub.status !== 'active') continue;

                let nextPay: Date;
                if (sub.nextPaymentDate && typeof sub.nextPaymentDate.toDate === 'function') {
                    nextPay = sub.nextPaymentDate.toDate();
                } else if (sub.nextPaymentDate?.seconds) {
                    nextPay = new Date(sub.nextPaymentDate.seconds * 1000);
                } else {
                    nextPay = new Date(sub.nextPaymentDate);
                }

                console.log(`📅 Plan: ${sub.planName}, Next Pay: ${nextPay.toLocaleString()}, Now: ${now.toLocaleString()}`);

                if (nextPay <= now) {
                    await this.executePayment(freshProfile, sub);
                }
            }
        } catch (error) {
            console.error("❌ AutoPay processing error:", error);
        }
    }

    private static async executePayment(profile: UserProfile, sub: UserSubscription) {
        console.log(`💸 EXECUTING: ${sub.planName} (₹${sub.amount})`);

        try {
            const password = localStorage.getItem('temp_vault_key');
            if (!password) {
                console.error("❌ AutoPay failed: Vault key (signature) missing in storage");
                return;
            }

            if (!profile.encryptedSecret) {
                console.error("❌ AutoPay failed: Profile is missing encryptedSecret", profile);
                return;
            }

            const secret = decryptSecret(profile.encryptedSecret, password);
            if (!secret || !secret.startsWith('S')) {
                console.error(`❌ AutoPay failed: Decryption failed for ${sub.planName}. Secret starts with: ${secret ? secret.substring(0, 1) : 'null'}`);
                return;
            }

            // Convert INR to XLM 
            const xlmAmount = (sub.amount / 8.42).toFixed(7);

            // Check balance
            const balanceStr = await getBalance(profile.publicKey);
            const balance = parseFloat(balanceStr);
            if (balance < parseFloat(xlmAmount)) {
                console.warn(`⚠️ AutoPay failed: Insufficient balance (${balanceStr} XLM) for ${sub.planName}`);
                return;
            }

            // Perform payment - Resolve ID to Public Key first
            const merchantInfo = await getUserById(sub.merchantStellarId);
            if (!merchantInfo) {
                console.error(`❌ AutoPay failed: Merchant ${sub.merchantStellarId} not found in ID registry`);
                return;
            }

            const hash = await sendPayment(
                secret,
                merchantInfo.publicKey,
                xlmAmount,
                `AutoPay: ${sub.planName}`
            );

            // Calculate next payment date
            const nextDate = new Date();
            if (sub.frequency === 'minutely') nextDate.setMinutes(nextDate.getMinutes() + 1);
            else if (sub.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (sub.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (sub.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            // Update database
            // await updateSubscriptionPayment(sub.id, nextDate);
            await updatePersonalSpend(profile.uid, sub.amount);
            await recordTransaction({
                fromId: profile.stellarId,
                toId: sub.merchantStellarId,
                fromName: profile.displayName || profile.stellarId,
                toName: sub.planName,
                amount: sub.amount,
                currency: 'INR',
                status: 'SUCCESS',
                txHash: hash,
                isFamilySpend: false,
                category: 'Bills'
            });

            // Trigger in-app notification
            NotificationService.sendInAppNotification(
                sub.merchantStellarId,
                "AutoPay Received",
                `Received ₹${sub.amount} for ${sub.planName} from ${profile.displayName || profile.stellarId.split('@')[0]}`,
                'payment'
            );

            console.log(`✅ AutoPay SUCCESS: ${sub.planName}. Next scheduled: ${nextDate.toLocaleString()}`);
        } catch (error) {
            console.error(`❌ AutoPay execution failed for ${sub.planName}:`, error);
        }
    }
}
