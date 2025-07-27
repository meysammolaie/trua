
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

const StatsSchema = z.object({
    totalTransactions: z.number(),
    totalRevenue: z.number(),
    lotteryPool: z.number(),
    revenueChartData: z.array(ChartDataPointSchema),
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
}

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: Timestamp;
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
    // 1. Fetch all users, investments, and transactions in parallel
    const usersCollection = collection(db, "users");
    const investmentsCollection = collection(db, "investments");
    const transactionsCollection = collection(db, "transactions");
    const settingsPromise = getPlatformSettings();

    const [usersSnapshot, investmentsSnapshot, dbTransactionsSnapshot, settings] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(investmentsCollection)),
      getDocs(query(transactionsCollection)),
      settingsPromise
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    const investments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as InvestmentDocument) }));
    const dbTransactions = dbTransactionsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as TransactionDocument) }));

    // 2. Generate a comprehensive transaction list
    const allTransactions: TransactionWithUser[] = [];
    let totalRevenue = 0;
    let lotteryPool = 0;
    const revenueByMonth: Record<string, number> = {};

    // Process actual investments and calculate fees
    investments.forEach(inv => {
        const user = usersMap.get(inv.userId);
        const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص';
        const userEmail = user ? user.email : 'ایمیل نامشخص';
        const investmentDate = inv.createdAt.toDate();
        
        if (inv.status === 'active') {
            const fees = {
                entry: inv.amount * (settings.entryFee / 100),
                lottery: inv.amount * (settings.lotteryFee / 100),
                platform: inv.amount * (settings.platformFee / 100),
            };

            const investmentRevenue = fees.entry + fees.lottery + fees.platform;
            totalRevenue += investmentRevenue;
            lotteryPool += fees.lottery;
            
            const monthKey = `${investmentDate.getFullYear()}/${String(investmentDate.getMonth() + 1).padStart(2, '0')}`;
            if (!revenueByMonth[monthKey]) {
                revenueByMonth[monthKey] = 0;
            }
            revenueByMonth[monthKey] += investmentRevenue;
        }

        allTransactions.push({
            id: inv.id,
            userId: inv.userId,
            userFullName,
            userEmail,
            fundId: inv.fundId,
            amount: -inv.amount,
            type: 'investment',
            status: inv.status,
            createdAt: investmentDate.toLocaleDateString('fa-IR'),
            originalInvestmentId: inv.id,
        });
    });

    // Process transactions from the transactions collection
    dbTransactions.forEach(tx => {
        const user = usersMap.get(tx.userId);
        const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص';
        const userEmail = user ? user.email : 'ایمیل نامشخص';
        
        allTransactions.push({
            id: tx.id,
            userId: tx.userId,
            userFullName,
            userEmail,
            amount: tx.amount,
            type: tx.type,
            status: 'completed',
            createdAt: tx.createdAt.toDate().toLocaleDateString('fa-IR'),
        });
    });

    // 3. Prepare chart data
    const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    const revenueChartData = Object.entries(revenueByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, value]) => {
            const monthIndex = parseInt(key.split('/')[1], 10) - 1;
            return {
                date: monthNames[monthIndex],
                revenue: value,
            };
        });

    // Sort all generated transactions by date descending
    const sortedTransactions = allTransactions.sort((a, b) => {
      // A simple date string comparison is not robust, but works for fa-IR format (YYYY/MM/DD)
      return b.createdAt.localeCompare(a.createdAt);
    });

    return {
      transactions: sortedTransactions,
      stats: {
        totalTransactions: sortedTransactions.length,
        totalRevenue,
        lotteryPool,
        revenueChartData
      },
    };
  }
);
