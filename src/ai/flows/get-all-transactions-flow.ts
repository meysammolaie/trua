
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
import { v4 as uuidv4 } from 'uuid';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
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
    type: 'profit_payout';
    amount: number;
    createdAt: Timestamp;
}

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: Timestamp;
};

// Helper function to simulate a slightly earlier date
const subtractMinutes = (date: Date, minutes: number) => {
    return new Date(date.getTime() - minutes * 60000);
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

    const [usersSnapshot, investmentsSnapshot, profitPayoutsSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(investmentsCollection, orderBy("createdAt", "desc"))),
      getDocs(query(transactionsCollection, where("type", "==", "profit_payout"), orderBy("createdAt", "desc")))
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    const investments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as InvestmentDocument) }));
    const profitPayouts = profitPayoutsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as TransactionDocument) }));


    // 2. Generate a comprehensive transaction list from investments
    const allTransactions: TransactionWithUser[] = [];
    let totalRevenue = 0;
    let lotteryPool = 0;
    const revenueByMonth: Record<string, number> = {};

    investments.forEach(inv => {
        const user = usersMap.get(inv.userId);
        const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص';
        const userEmail = user ? user.email : 'ایمیل نامشخص';
        const investmentDate = inv.createdAt.toDate();
        
        // Fees and revenue are only calculated for active investments
        if (inv.status === 'active') {
            const fees = {
                entry: inv.amount * 0.03,
                lottery: inv.amount * 0.02,
                platform: inv.amount * 0.01,
            };

            totalRevenue += fees.entry + fees.lottery + fees.platform;
            lotteryPool += fees.lottery;
            
            const monthKey = `${investmentDate.getFullYear()}/${String(investmentDate.getMonth() + 1).padStart(2, '0')}`;
            if (!revenueByMonth[monthKey]) {
                revenueByMonth[monthKey] = 0;
            }
            revenueByMonth[monthKey] += fees.entry + fees.lottery + fees.platform;

            // Simulate fee transactions for active investments
            allTransactions.push({
                id: `fee-entry-${inv.id}`,
                userId: inv.userId, userFullName, userEmail, fundId: inv.fundId,
                amount: fees.entry,
                type: 'fee_entry',
                status: 'completed',
                createdAt: subtractMinutes(investmentDate, 1).toLocaleDateString('fa-IR'),
                originalInvestmentId: inv.id,
            });
            allTransactions.push({
                id: `fee-lottery-${inv.id}`,
                userId: inv.userId, userFullName, userEmail, fundId: inv.fundId,
                amount: fees.lottery,
                type: 'fee_lottery',
                status: 'completed',
                createdAt: subtractMinutes(investmentDate, 1).toLocaleDateString('fa-IR'),
                originalInvestmentId: inv.id,
            });
            allTransactions.push({
                id: `fee-platform-${inv.id}`,
                userId: inv.userId, userFullName, userEmail, fundId: inv.fundId,
                amount: fees.platform,
                type: 'fee_platform',
                status: 'completed',
                createdAt: subtractMinutes(investmentDate, 1).toLocaleDateString('fa-IR'),
                originalInvestmentId: inv.id,
            });
        }


        // Simulate a "Deposit" transaction that happened slightly before the investment
        allTransactions.push({
            id: `dep-${inv.id}`,
            userId: inv.userId,
            userFullName,
            userEmail,
            fundId: inv.fundId,
            amount: inv.amount,
            type: 'deposit',
            status: 'completed',
            createdAt: subtractMinutes(investmentDate, 2).toLocaleDateString('fa-IR'),
            originalInvestmentId: inv.id,
        });
        
        // The actual "Investment" transaction
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

    // Add profit payouts to the list
    profitPayouts.forEach(payout => {
        const user = usersMap.get(payout.userId);
        const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص';
        const userEmail = user ? user.email : 'ایمیل نامشخص';
        
        allTransactions.push({
            id: payout.id,
            userId: payout.userId,
            userFullName,
            userEmail,
            amount: payout.amount,
            type: 'profit_payout',
            status: 'completed',
            createdAt: payout.createdAt.toDate().toLocaleDateString('fa-IR'),
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

    // Sort all generated transactions by date descending (approximation)
    const sortedTransactions = allTransactions.sort((a, b) => {
      const getMillis = (id?: string) => {
        if (!id) return new Date().getTime(); // Should not happen for investments
        const investment = investments.find(inv => inv.id === id);
        if (investment) return investment.createdAt.toMillis();
        const payout = profitPayouts.find(p => p.id === id);
        if (payout) return payout.createdAt.toMillis();
        return 0;
      }
      const dateA = new Date(getMillis(a.originalInvestmentId || a.id));
      const dateB = new Date(getMillis(b.originalInvestmentId || b.id));
      return dateB.getTime() - dateA.getTime();
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
// Needed for generating unique IDs for simulated transactions
const crypto = require('crypto');
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => uuidv4(),
    },
});
