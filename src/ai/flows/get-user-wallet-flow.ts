
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
import { collection, query, where, getDocs, orderBy, Timestamp, limit, doc, getDoc } from 'firebase/firestore';
import { getUserDetails } from './get-user-details-flow';
import { GetUserWalletInputSchema, GetUserWalletOutputSchema, AssetSchema, TransactionSchema } from '@/ai/schemas';

const ai = genkit({
  plugins: [googleAI()],
});

export type GetUserWalletInput = z.infer<typeof GetUserWalletInputSchema>;
export type GetUserWalletOutput = z.infer<typeof GetUserWalletOutputSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;


type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  netAmountUSD: number; // Use net amount for asset value
  status: 'pending' | 'active' | 'completed';
  createdAt: Timestamp;
};

const fundNames: Record<string, string> = {
    gold: "صندوق طلا",
    silver: "صندوق نقره",
    usdt: "تتر",
    bitcoin: "بیت‌کوین"
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
    
    // 1. Fetch comprehensive user details from the single source of truth flow
    const userDetails = await getUserDetails({ userId });

    // 2. Fetch active investments to calculate asset breakdown
    const investmentsCollection = collection(db, "investments");
    const investmentsQuery = query(
        investmentsCollection, 
        where("userId", "==", userId),
        where("status", "==", "active") // Only 'active' investments contribute to asset breakdown
    );
    const investmentsSnapshot = await getDocs(investmentsQuery);
    
    const assetsMap: Record<string, number> = {};

    investmentsSnapshot.docs.forEach(doc => {
        const data = doc.data() as InvestmentDocument;
        const fundName = fundNames[data.fundId as keyof typeof fundNames] || data.fundId;
        const assetValue = data.amountUSD || 0; // Asset value is based on gross investment

        if (!assetsMap[fundName]) {
            assetsMap[fundName] = 0;
        }
        assetsMap[fundName] += assetValue;
    });

    const assets: Asset[] = Object.entries(assetsMap).map(([fund, value]) => ({
        fund,
        value,
    }));
    
    // 3. Get recent transactions from user details
    const recentTransactions = userDetails.transactions.slice(0, 5);
    
    // 4. Use the balances from user details, which is now the single source of truth
    const totalBalance = userDetails.stats.walletBalance; 
    const withdrawableBalance = userDetails.stats.walletBalance; // Defined to be the same as total balance
    const totalAssetValue = userDetails.stats.grossInvestment; // Total Asset value is the gross of active investments

    return {
      assets,
      recentTransactions,
      totalAssetValue,
      withdrawableBalance,
      totalBalance,
    };
  }
);
