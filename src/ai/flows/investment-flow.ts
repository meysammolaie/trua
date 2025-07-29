
'use server';
/**
 * @fileOverview A flow for handling new investment requests.
 *
 * - submitInvestment - Handles the submission of a new investment.
 * - InvestmentInput - The input type for the submitInvestment function.
 * - InvestmentOutput - The return type for the submitInvestment function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCryptoPrice } from '../tools/get-crypto-price-tool';
import { getPlatformSettings } from './platform-settings-flow';

const ai = genkit({
  plugins: [googleAI()],
});


const InvestmentInputSchema = z.object({
  userId: z.string().describe('The ID of the user making the investment.'),
  fundId: z.string().describe('The ID of the fund being invested in (e.g., "gold", "bitcoin").'),
  amount: z.number().describe('The amount of the investment in the fund\'s native unit (e.g., 0.5 BTC).'),
  transactionHash: z.string().describe('The transaction hash (TxID) of the deposit.'),
});
export type InvestmentInput = z.infer<typeof InvestmentInputSchema>;

const InvestmentOutputSchema = z.object({
  success: z.boolean().describe('Whether the investment submission was accepted.'),
  investmentId: z.string().describe('A unique ID for the new investment.'),
  message: z.string().describe('A confirmation or error message.'),
});
export type InvestmentOutput = z.infer<typeof InvestmentOutputSchema>;


export async function submitInvestment(input: InvestmentInput): Promise<InvestmentOutput> {
  return await investmentFlow(input);
}


const investmentFlow = ai.defineFlow(
  {
    name: 'investmentFlow',
    inputSchema: InvestmentInputSchema,
    outputSchema: InvestmentOutputSchema,
  },
  async (input) => {
    console.log('Received investment submission for user:', input.userId);
    
    try {
      // 1. Get platform settings and current price in parallel
      const [settings, priceData] = await Promise.all([
        getPlatformSettings(),
        getCryptoPrice({ cryptoId: input.fundId })
      ]);
      
      const unitPrice = priceData.usd;
      const amountUSD = input.amount * unitPrice;

      // 2. Calculate fees based on USD value
      const entryFee = amountUSD * (settings.entryFee / 100);
      const lotteryFee = amountUSD * (settings.lotteryFee / 100);
      const platformFee = amountUSD * (settings.platformFee / 100);
      const totalFees = entryFee + lotteryFee + platformFee;
      const netAmountUSD = amountUSD - totalFees;

      // 3. Add investment to Firestore
      const investmentsCollection = collection(db, 'investments');
      const docRef = await addDoc(investmentsCollection, {
        userId: input.userId,
        fundId: input.fundId,
        amount: input.amount, // amount in native unit (e.g., BTC)
        amountUSD: amountUSD, // Gross amount in USD at time of investment
        netAmountUSD: netAmountUSD, // Net amount after fees
        feesUSD: totalFees, // Total fees in USD
        unitPrice: unitPrice, // price per unit at time of investment
        transactionHash: input.transactionHash,
        status: 'pending', // Statuses: 'pending', 'active', 'completed', 'rejected'
        createdAt: serverTimestamp(),
      });

      console.log("Investment document written with ID: ", docRef.id);

      return {
        success: true,
        investmentId: docRef.id,
        message: `Your investment has been submitted and is now pending admin approval. Tracking ID: ${docRef.id}`,
      };
    } catch (e) {
        console.error("Error adding document: ", e);
        return {
            success: false,
            investmentId: '',
            message: 'An error occurred while saving your investment to the database.',
        };
    }
  }
);
