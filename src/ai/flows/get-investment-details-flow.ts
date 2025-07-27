
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

const ai = genkit({
  plugins: [googleAI()],
});

export const GetInvestmentDetailsInputSchema = z.object({
  investmentId: z.string().describe('The ID of the investment to fetch.'),
});
export type GetInvestmentDetailsInput = z.infer<typeof GetInvestmentDetailsInputSchema>;

const fundNames: Record<string, string> = {
    gold: "طلا",
    silver: "نقره",
    usdt: "تتر",
    bitcoin: "بیت‌کوین"
};

export const GetInvestmentDetailsOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userFullName: z.string(),
  userEmail: z.string(),
  fundId: z.string(),
  fundName: z.string(),
  amount: z.number(),
  amountUSD: z.number(),
  transactionHash: z.string(),
  status: z.enum(['pending', 'active', 'completed', 'rejected']),
  createdAt: z.string(),
  rejectionReason: z.string().optional(),
});
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
        userFullName: userData ? `${userData.firstName} ${userData.lastName}`.trim() : 'کاربر نامشخص',
        userEmail: userData ? userData.email : 'ایمیل نامشخص',
        fundId: investmentData.fundId,
        fundName: fundNames[investmentData.fundId] || investmentData.fundId,
        amount: investmentData.amount,
        amountUSD: investmentData.amountUSD,
        transactionHash: investmentData.transactionHash,
        status: investmentData.status,
        createdAt: (investmentData.createdAt as Timestamp).toDate().toLocaleString('fa-IR'),
        rejectionReason: investmentData.rejectionReason,
    };
  }
);
