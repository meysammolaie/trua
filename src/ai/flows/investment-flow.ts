
'use server';
/**
 * @fileOverview A flow for handling new investment requests.
 *
 * - submitInvestment - Handles the submission of a new investment.
 * - InvestmentInput - The input type for the submitInvestment function.
 * - InvestmentOutput - The return type for the submitInvestment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


const InvestmentInputSchema = z.object({
  userId: z.string().describe('The ID of the user making the investment.'),
  fundId: z.string().describe('The ID of the fund being invested in (e.g., "gold", "bitcoin").'),
  amount: z.number().describe('The amount of the investment in USD.'),
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
      // Here you could add a step to automatically verify the transaction hash with a blockchain service.
      // For now, we assume it's valid and set the status to 'pending' for admin approval.
      const investmentsCollection = collection(db, 'investments');
      const docRef = await addDoc(investmentsCollection, {
        userId: input.userId,
        fundId: input.fundId,
        amount: input.amount,
        transactionHash: input.transactionHash,
        status: 'pending', // Statuses: 'pending', 'active', 'completed', 'rejected'
        createdAt: serverTimestamp(),
      });

      console.log("Investment document written with ID: ", docRef.id);

      return {
        success: true,
        investmentId: docRef.id,
        message: `سرمایه‌گذاری شما ثبت شد و اکنون در انتظار تایید مدیر است. شناسه پیگیری: ${docRef.id}`,
      };
    } catch (e) {
        console.error("Error adding document: ", e);
        return {
            success: false,
            investmentId: '',
            message: 'خطایی در ثبت سرمایه‌گذاری شما در پایگاه داده رخ داد.',
        };
    }
  }
);
