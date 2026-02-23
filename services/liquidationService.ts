
import { Keypair } from '@stellar/stellar-sdk';
import { getLivePrice } from './priceService';
import { sendPayment } from './stellar';

// For Demo/Sandbox: This address acts as the Ching Pay Liquidation Bridge
// In production, this would be Onmeta's or Onramp's deposit address
export const SANDBOX_BRIDGE_ADDRESS = 'GA5ZSEJYB37JRC5AVCIAZDL6WGCF6Y7P5SBTVZGC3R5FNPQFYVCP3BTH';

export interface LiquidationQuote {
    inrAmount: number;
    xlmAmount: string;
    fee: number;
    rate: number;
    expiresAt: number;
}

export class LiquidationService {
    /**
     * Get a quote for converting XLM to INR for a UPI payout
     */
    static async getQuote(inrAmount: number): Promise<LiquidationQuote> {
        const rate = await getLivePrice('stellar');

        // Add 1.5% fee for the bridge/liquidation service
        const feePercent = 0.015;
        const feeInr = inrAmount * feePercent;
        const totalInr = inrAmount + feeInr;

        // Calculate XLM with a small volatility buffer (0.5%)
        const xlmAmount = (totalInr / rate * 1.005).toFixed(7);

        return {
            inrAmount,
            xlmAmount,
            fee: feeInr,
            rate,
            expiresAt: Date.now() + 60000 // Valid for 60 seconds
        };
    }

    /**
     * Executes the direct liquidation flow:
     * 1. Send XLM to the Bridge Address
     * 2. (Simulated) Bridge triggers the UPI payout
     */
    static async executeDirectLiquidation(
        senderSecret: string,
        upiId: string,
        quote: LiquidationQuote
    ): Promise<{ txHash: string; payoutId: string }> {
        console.log(`[Liquidation] Initiating direct payout of ₹${quote.inrAmount} to ${upiId}`);

        // 1. Send XLM to the Bridge
        const txHash = await sendPayment(
            senderSecret,
            SANDBOX_BRIDGE_ADDRESS,
            quote.xlmAmount,
            `UPI-OUT:${upiId.substring(0, 15)}`
        );

        console.log(`[Liquidation] XLM Sent to Bridge. Hash: ${txHash}`);
        console.log(`[Liquidation] Triggering Sandbox UPI Payout to ${upiId}...`);

        // 2. Simulate the API delay for the banking payout
        await new Promise(resolve => setTimeout(resolve, 2000));

        const payoutId = "upi_tx_" + Math.random().toString(36).substring(2, 12).toUpperCase();

        return {
            txHash,
            payoutId
        };
    }
}
