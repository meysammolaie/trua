
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
  status: z.enum(['pending', 'active', 'completed', 'failed', 'rejected', 'refunded']).optional(),
  createdAt: z.string(),
  createdAtTimestamp: z.number(), // For sorting
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
    platformRevenue: z.number(),
    lotteryPool: z.number(),
    profitPool: z.number(), 
    totalActiveInvestment: z.number(),
    investorCount: z.number(),
});

const StatsSchema = z.object({
    totalTransactions: z.number(),
    totalPlatformRevenue: z.number(),
    totalLotteryPool: z.number(),
    totalProfitPool: z.number(), 
    totalPlatformWallet: z.number(), 
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
    status?: 'pending' | 'active' | 'completed' | 'failed' | 'rejected' | 'refunded';
    originalInvestmentId?: string;
}

type DailyFeeDocument = {
    id: string;
    type: 'entry_fee' | 'exit_fee' | 'lottery_fee' | 'platform_fee';
    amount: number;
    distributed: boolean;
    fundId: string;
}

type InvestmentDocument = {
    netAmountUSD: number;
    fundId: string;
    userId: string;
}

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
    const dbTransactionsQuery = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const feesQuery = query(collection(db, "daily_fees"));
    const investmentsQuery = query(collection(db, "investments"), where('status', '==', 'active'));

    const [usersSnapshot, dbTransactionsSnapshot, feesSnapshot, investmentsSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(dbTransactionsQuery),
      getDocs(feesQuery),
      getDocs(investmentsQuery)
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    const dbTransactions = dbTransactionsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as TransactionDocument) }));
    const allFees = feesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as DailyFeeDocument));
    const activeInvestments = investmentsSnapshot.docs.map(doc => doc.data() as InvestmentDocument);


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
            status: tx.status,
            createdAt: tx.createdAt.toDate().toLocaleDateString('fa-IR'),
            createdAtTimestamp: tx.createdAt.toMillis(),
            originalInvestmentId: tx.originalInvestmentId
        };
    });

    const fundStats: Record<string, { platformRevenue: number, lotteryPool: number, profitPool: number, totalActiveInvestment: number, investors: Set<string> }> = {
        gold: { platformRevenue: 0, lotteryPool: 0, profitPool: 0, totalActiveInvestment: 0, investors: new Set() },
        silver: { platformRevenue: 0, lotteryPool: 0, profitPool: 0, totalActiveInvestment: 0, investors: new Set() },
        usdt: { platformRevenue: 0, lotteryPool: 0, profitPool: 0, totalActiveInvestment: 0, investors: new Set() },
        bitcoin: { platformRevenue: 0, lotteryPool: 0, profitPool: 0, totalActiveInvestment: 0, investors: new Set() },
    };

    allFees.forEach(fee => {
        if (fundStats[fee.fundId]) {
            if (fee.type === 'platform_fee') {
                fundStats[fee.fundId].platformRevenue += fee.amount;
            } else if (fee.type === 'lottery_fee') {
                fundStats[fee.fundId].lotteryPool += fee.amount;
            } else if ((fee.type === 'entry_fee' || fee.type === 'exit_fee') && !fee.distributed) {
                fundStats[fee.fundId].profitPool += fee.amount;
            }
        }
    });
    
    activeInvestments.forEach(inv => {
        if (fundStats[inv.fundId]) {
            fundStats[inv.fundId].totalActiveInvestment += inv.netAmountUSD;
            fundStats[inv.fundId].investors.add(inv.userId);
        }
    });

    const fundStatsArray = Object.entries(fundStats).map(([id, data]) => ({
        id,
        name: fundNames[id],
        platformRevenue: data.platformRevenue,
        lotteryPool: data.lotteryPool,
        profitPool: data.profitPool,
        totalActiveInvestment: data.totalActiveInvestment,
        investorCount: data.investors.size,
    }));
    
    const totalPlatformRevenue = fundStatsArray.reduce((sum, fund) => sum + fund.platformRevenue, 0);
    const totalLotteryPool = fundStatsArray.reduce((sum, fund) => sum + fund.lotteryPool, 0);
    const totalProfitPool = fundStatsArray.reduce((sum, fund) => sum + fund.profitPool, 0);
    const totalPlatformWallet = fundStatsArray.reduce((sum, fund) => sum + fund.totalActiveInvestment, 0);


    return {
      transactions: allTransactions,
      stats: {
        totalTransactions: allTransactions.length,
        totalPlatformRevenue: totalPlatformRevenue,
        totalLotteryPool: totalLotteryPool,
        totalProfitPool: totalProfitPool,
        totalPlatformWallet: totalPlatformWallet,
        fundStats: fundStatsArray,
      },
    };
  }
);
