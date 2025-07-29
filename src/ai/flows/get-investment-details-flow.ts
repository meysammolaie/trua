
'use server';
/**
 * @fileOverview A flow for fetching all details for a single investment record.
 *
 * - getInvestmentDetails - Fetches investment, user, and transaction hash.
 * - GetInvestmentDetailsInput - The input type for the function.
 * - GetInvestmentDetailsOutput - The return type for the function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { GetInvestmentDetailsInputSchema, GetInvestmentDetailsOutputSchema } from '@/ai/schemas';

const ai = genkit({
  plugins: [googleAI()],
});


export type GetInvestmentDetailsInput = z.infer<typeof GetInvestmentDetailsInputSchema>;


const fundNames: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    usdt: "USDT",
    bitcoin: "Bitcoin"
};

export type GetInvestmentDetailsOutput = z.infer<typeof GetInvestmentDetailsOutputSchema>;


export async function getInvestmentDetails(input: GetInvestmentDetailsInput): Promise<GetInvestmentDetailsOutput> {
  return await getInvestmentDetailsFlow(input);
}

const getInvestmentDetailsFlow = ai.defineFlow(
  {
    name: 'getInvestmentDetailsFlow',
    inputSchema: GetInvestmentDetailsInputSchema,
    outputSchema: GetInvestmentDetailsOutputSchema,
  },
  async ({ investmentId }) => {
    
    const investmentRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentRef);

    if (!investmentSnap.exists()) {
      throw new Error(`Investment with ID ${investmentId} not found.`);
    }
    const investmentData = investmentSnap.data();

    const userRef = doc(db, 'users', investmentData.userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;

    return {
        id: investmentSnap.id,
        userId: investmentData.userId,
        userFullName: userData ? `${userData.firstName} ${userData.lastName}`.trim() : 'Unknown User',
        userEmail: userData ? userData.email : 'Unknown Email',
        fundId: investmentData.fundId,
        fundName: fundNames[investmentData.fundId] || investmentData.fundId,
        amount: investmentData.amount,
        amountUSD: investmentData.amountUSD,
        transactionHash: investmentData.transactionHash,
        status: investmentData.status,
        createdAt: (investmentData.createdAt as Timestamp).toDate().toLocaleString('en-US'),
        rejectionReason: investmentData.rejectionReason,
    };
  }
);
