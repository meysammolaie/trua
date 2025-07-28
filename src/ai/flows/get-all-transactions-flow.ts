
'use server';
/**
 * @fileOverview A flow for fetching all transactions from Firestore and simulating related financial events.
 *
 * - getAllTransactions - Fetches all investments and generates a comprehensive transaction list.
 * - TransactionWithUser - The type for a single transaction record with user details.
 * - GetAllTransactionsOutput - The return type for the getAllTransactions function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

const ai = genkit({
  plugins: [googleAI()],
});

// Sub-schemas
const TransactionWithUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userFullName: z.string(),
  userEmail: z.string(),
  fundId: z.string().optional(),
  amount: z.number(),
  type: z.string(),
  status: z.enum(['pending', 'active', 'completed', 'failed', 'rejected']).optional(),
  createdAt: z.string(),
  originalInvestmentId: z.string().optional(),
});
export type TransactionWithUser = z.infer<typeof TransactionWithUserSchema>;

const ChartDataPointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
});

const FundStatSchema = z.object({
    id: z.string(),
    name: z.string(),
    revenue: z.number(),
    lotteryPool: z.number(),
});

const StatsSchema = z.object({
    totalTransactions: z.number(),
    totalRevenue: z.number(),
    totalLotteryPool: z.number(),
    fundStats: z.array(FundStatSchema),
});
export type AllTransactionsStats = z.infer<typeof StatsSchema>;


// Main Output Schema
const GetAllTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionWithUserSchema),
  stats: StatsSchema,
});
export type GetAllTransactionsOutput = z.infer<typeof GetAllTransactionsOutputSchema>;

// Firestore Document Types
type UserDocument = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
};

type TransactionDocument = {
    id: string;
    userId: string;
    type: string;
    amount: number;
    createdAt: Timestamp;
    details?: string;
    fundId?: string;
}

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  amountUSD: number;
  feesUSD: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: Timestamp;
};

const fundNames: Record<string, string> = {
    gold: "طلا",
    silver: "نقره",
    usdt: "تتر",
    bitcoin: "بیت‌کوین"
};


export async function getAllTransactions(): Promise<GetAllTransactionsOutput> {
  return await getAllTransactionsFlow({});
}

const getAllTransactionsFlow = ai.defineFlow(
  {
    name: 'getAllTransactionsFlow',
    inputSchema: z.object({}),
    outputSchema: GetAllTransactionsOutputSchema,
  },
  async () => {
    const usersCollection = collection(db, "users");
    const investmentsCollection = collection(db, "investments");
    const dbTransactionsQuery = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const settingsPromise = getPlatformSettings();

    const [usersSnapshot, investmentsSnapshot, dbTransactionsSnapshot, settings] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(investmentsCollection)),
      getDocs(dbTransactionsQuery),
      settingsPromise
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    const investments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as InvestmentDocument) }));
    const dbTransactions = dbTransactionsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as TransactionDocument) }));

    const allTransactions: TransactionWithUser[] = dbTransactions.map(tx => {
        const user = usersMap.get(tx.userId);
        const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص';
        const userEmail = user ? user.email : 'ایمیل نامشخص';
        
        return {
            id: tx.id,
            userId: tx.userId,
            userFullName,
            userEmail,
            fundId: tx.fundId,
            amount: tx.amount,
            type: tx.type,
            status: 'completed', // All ledger transactions are considered complete
            createdAt: tx.createdAt.toDate().toLocaleDateString('fa-IR'),
        };
    });

    // Calculate stats based on all investments
    let totalRevenue = 0;
    let totalLotteryPool = 0;
    const fundStats: Record<string, { revenue: number, lotteryPool: number }> = {
        gold: { revenue: 0, lotteryPool: 0 },
        silver: { revenue: 0, lotteryPool: 0 },
        usdt: { revenue: 0, lotteryPool: 0 },
        bitcoin: { revenue: 0, lotteryPool: 0 },
    };

    investments.forEach(inv => {
        if (inv.status === 'active' || inv.status === 'completed') {
            const entryFee = inv.amountUSD * (settings.entryFee / 100);
            const lotteryFee = inv.amountUSD * (settings.lotteryFee / 100);
            const platformFee = inv.amountUSD * (settings.platformFee / 100);

            const investmentRevenue = entryFee + platformFee; // Revenue for platform is entry and platform fees
            totalRevenue += investmentRevenue;
            totalLotteryPool += lotteryFee;

            if (fundStats[inv.fundId]) {
                fundStats[inv.fundId].revenue += investmentRevenue;
                fundStats[inv.fundId].lotteryPool += lotteryFee;
            }
        }
    });

    const fundStatsArray = Object.entries(fundStats).map(([id, data]) => ({
        id,
        name: fundNames[id],
        ...data,
    }));


    return {
      transactions: allTransactions,
      stats: {
        totalTransactions: allTransactions.length,
        totalRevenue,
        totalLotteryPool,
        fundStats: fundStatsArray,
      },
    };
  }
);
