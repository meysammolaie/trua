
'use server';
/**
 * @fileOverview A flow for fetching a user's wallet data from Firestore.
 *
 * - getUserWallet - Fetches wallet assets and recent transactions for a given user.
 * - GetUserWalletInput - The input type for the getUserWallet function.
 * - GetUserWalletOutput - The return type for the getUserWallet function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

const GetUserWalletInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose wallet data is to be fetched.'),
});
export type GetUserWalletInput = z.infer<typeof GetUserWalletInputSchema>;

const AssetSchema = z.object({
    fund: z.string(),
    value: z.number(),
});
export type Asset = z.infer<typeof AssetSchema>;

const TransactionSchema = z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    date: z.string(),
    amount: z.number(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

const GetUserWalletOutputSchema = z.object({
  assets: z.array(AssetSchema),
  recentTransactions: z.array(TransactionSchema),
  totalBalance: z.number(),
});
export type GetUserWalletOutput = z.infer<typeof GetUserWalletOutputSchema>;

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  transactionHash: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: Timestamp;
};

const fundNames: Record<string, string> = {
    gold: "صندوق طلا",
    silver: "صندوق نقره",
    dollar: "صندوق دلار",
    bitcoin: "صندوق بیت‌کوین"
};

const statusNames: Record<string, string> = {
    pending: "در انتظار",
    active: "فعال",
    completed: "خاتمه یافته",
};

export async function getUserWallet(input: GetUserWalletInput): Promise<GetUserWalletOutput> {
  return await getUserWalletFlow(input);
}

const getUserWalletFlow = ai.defineFlow(
  {
    name: 'getUserWalletFlow',
    inputSchema: GetUserWalletInputSchema,
    outputSchema: GetUserWalletOutputSchema,
  },
  async ({ userId }) => {
    
    const investmentsCollection = collection(db, "investments");
    const q = query(
        investmentsCollection, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    
    const assetsMap: Record<string, number> = {};
    let totalBalance = 0;

    const allTransactions = querySnapshot.docs.map(doc => {
        const data = doc.data() as InvestmentDocument;
        const fundName = fundNames[data.fundId as keyof typeof fundNames] || data.fundId;

        // Only active investments contribute to the balance and asset breakdown
        if (data.status === 'active') {
            if (!assetsMap[fundName]) {
                assetsMap[fundName] = 0;
            }
            assetsMap[fundName] += data.amount;
            totalBalance += data.amount;
        }

        return {
            id: doc.id,
            type: "سرمایه‌گذاری",
            status: statusNames[data.status as keyof typeof statusNames] || data.status,
            date: data.createdAt.toDate().toLocaleDateString('fa-IR'),
            amount: -Math.abs(data.amount), // Show as outgoing
        };
    });

    const assets: Asset[] = Object.entries(assetsMap).map(([fund, value]) => ({
        fund,
        value,
    }));
    
    // In a real app, you would fetch other transaction types (profits, withdrawals)
    // and merge them here, then sort by date before taking the last 5.
    const recentTransactions = allTransactions.slice(0, 5);
    
    return {
      assets,
      recentTransactions,
      totalBalance,
    };
  }
);
