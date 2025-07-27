
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

const ai = genkit({
  plugins: [googleAI()],
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
  totalAssetValue: z.number().describe("The total value of all active investments."),
  withdrawableBalance: z.number().describe("The balance available for withdrawal from the wallet."),
  totalBalance: z.number().describe("The sum of totalAssetValue and withdrawableBalance."),
});
export type GetUserWalletOutput = z.infer<typeof GetUserWalletOutputSchema>;

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
    
    // 1. Fetch user document to get the authoritative withdrawableBalance
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const withdrawableBalance = userSnap.exists() ? userSnap.data().walletBalance || 0 : 0;

    // 2. Fetch all investments to calculate asset values
    const investmentsCollection = collection(db, "investments");
    const investmentsQuery = query(
        investmentsCollection, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const investmentsSnapshot = await getDocs(investmentsQuery);
    
    const assetsMap: Record<string, number> = {};
    let totalAssetValue = 0;

    const allTransactions = investmentsSnapshot.docs.map(doc => {
        const data = doc.data() as InvestmentDocument;
        const fundName = fundNames[data.fundId as keyof typeof fundNames] || data.fundId;
        const assetValue = data.netAmountUSD || 0; // Use net amount for value

        // Only active investments contribute to the asset breakdown
        if (data.status === 'active') {
            if (!assetsMap[fundName]) {
                assetsMap[fundName] = 0;
            }
            assetsMap[fundName] += assetValue;
            totalAssetValue += assetValue;
        }

        return {
            id: doc.id,
            type: "سرمایه‌گذاری",
            status: statusNames[data.status as keyof typeof statusNames] || data.status,
            date: data.createdAt.toDate().toLocaleDateString('fa-IR'),
            amount: -Math.abs(assetValue), // Show net amount as outgoing
        };
    });

    const assets: Asset[] = Object.entries(assetsMap).map(([fund, value]) => ({
        fund,
        value,
    }));
    
    // 3. In a real app, you would fetch other transaction types (profits, withdrawals)
    // and merge them here, then sort by date before taking the last 5.
    const recentTransactions = allTransactions.slice(0, 5);
    
    // 4. Calculate total balance
    const totalBalance = totalAssetValue + withdrawableBalance;

    return {
      assets,
      recentTransactions,
      totalAssetValue,
      withdrawableBalance,
      totalBalance,
    };
  }
);
