
'use server';
/**
 * @fileOverview A flow for fetching all details for a single user.
 * This is the single source of truth for user financial data.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { GetUserDetailsInputSchema, GetUserDetailsOutputSchema, UserProfileSchema, TransactionSchema, StatsSchema, ChartDataPointSchema } from '@/ai/schemas';

const ai = genkit({
  plugins: [googleAI()],
});


export type GetUserDetailsInput = z.infer<typeof GetUserDetailsInputSchema>;
export type GetUserDetailsOutput = z.infer<typeof GetUserDetailsOutputSchema>;

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amountUSD: number; 
  netAmountUSD: number; 
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: Timestamp;
  transactionHash: string;
};

type DbTransactionDocument = {
    id: string;
    userId: string;
    type: string;
    amount: number;
    status: 'completed' | 'pending' | 'rejected';
    createdAt: Timestamp;
    details?: string;
    proof?: string;
    withdrawalId?: string;
}

const fundNames: Record<string, string> = {
    gold: "طلا",
    silver: "نقره",
    usdt: "تتر",
    bitcoin: "بیت‌کوین"
};

const statusNames: Record<string, string> = {
    pending: "در انتظار",
    active: "فعال",
    completed: "تکمیل شده",
    rejected: "رد شده",
    withdrawal_request: "درخواست برداشت",
};

export async function getUserDetails(input: GetUserDetailsInput): Promise<GetUserDetailsOutput> {
  return await getUserDetailsFlow(input);
}

const getUserDetailsFlow = ai.defineFlow(
  {
    name: 'getUserDetailsFlow',
    inputSchema: GetUserDetailsInputSchema,
    outputSchema: GetUserDetailsOutputSchema,
  },
  async ({ userId }) => {
    
    // 1. Fetch user profile, investments, and all transactions in parallel
    const userDocRef = doc(db, "users", userId);
    const investmentsQuery = query(collection(db, "investments"), where("userId", "==", userId));
    const dbTransactionsQuery = query(collection(db, "transactions"), where("userId", "==", userId));

    const [userDoc, investmentsSnapshot, dbTransactionsSnapshot] = await Promise.all([
        getDoc(userDocRef),
        getDocs(investmentsQuery),
        getDocs(dbTransactionsQuery),
    ]);
    
    if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
    }
    const userData = userDoc.data();
    
    // 2. Calculate Active Investment (Net) and prepare data for charts/history
    let activeNetInvestment = 0;
    const investmentByMonth: Record<string, number> = {};
    const allTransactionsForHistory: (z.infer<typeof TransactionSchema> & { timestamp: number })[] = [];

    const activeInvestments = investmentsSnapshot.docs.filter(doc => doc.data().status === 'active');
    activeInvestments.forEach(doc => {
        const data = doc.data() as InvestmentDocument;
        activeNetInvestment += data.netAmountUSD;

        const date = data.createdAt.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if(!investmentByMonth[monthKey]) {
            investmentByMonth[monthKey] = 0;
        }
        investmentByMonth[monthKey] += data.amountUSD;
    });

    investmentsSnapshot.docs.forEach(doc => {
        const data = doc.data() as InvestmentDocument;
        const createdAt = data.createdAt.toDate();
        allTransactionsForHistory.push({
            id: doc.id,
            type: "investment",
            fund: fundNames[data.fundId as keyof typeof fundNames] || data.fundId,
            status: statusNames[data.status as keyof typeof statusNames] || data.status,
            date: createdAt.toLocaleDateString('fa-IR'),
            amount: -Math.abs(data.amountUSD),
            timestamp: createdAt.getTime(),
            proof: data.transactionHash
        });
    });

    // 3. Calculate REAL wallet balance and total profit by summing up the transactions collection
    let withdrawableBalance = 0;
    let totalProfit = 0;

    dbTransactionsSnapshot.docs.forEach(doc => {
        const data = doc.data() as DbTransactionDocument;
        const createdAt = data.createdAt.toDate();
        
        // Sum up amounts of all relevant transactions to get the current balance
        // Positive amounts are credits (profit), negative are debits (withdrawal requests)
        withdrawableBalance += data.amount;

        if (data.type === 'profit_payout' && data.status === 'completed') {
            totalProfit += data.amount;
        }
        
        allTransactionsForHistory.push({
            id: doc.id,
            type: data.type,
            fund: data.details || '-',
            status: statusNames[data.status as keyof typeof statusNames] || data.status || 'تکمیل شده',
            date: createdAt.toLocaleDateString('fa-IR'),
            amount: data.amount,
            timestamp: createdAt.getTime(),
            proof: data.proof,
        });
    })

    // 4. Prepare Chart Data
    const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    const investmentChartData = Object.entries(investmentByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, value]) => {
            const monthIndex = parseInt(key.split('-')[1], 10) - 1;
            return {
                month: monthNames[monthIndex],
                investment: value,
            };
        });

    // 5. Assemble final output
    const profile: z.infer<typeof UserProfileSchema> = {
        uid: userDoc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        createdAt: (userData.createdAt as Timestamp).toDate().toLocaleDateString('fa-IR'),
        status: userData.status || 'active',
    };
    
    const stats: z.infer<typeof StatsSchema> = {
        activeInvestment: activeNetInvestment,
        totalProfit: totalProfit,
        lotteryTickets: Math.floor(activeNetInvestment / 10),
        walletBalance: withdrawableBalance, 
        totalBalance: activeNetInvestment + withdrawableBalance,
    };
    
    const sortedTransactions = allTransactionsForHistory.sort((a,b) => b.timestamp - a.timestamp);

    return {
      profile,
      transactions: sortedTransactions.map(({timestamp, ...rest}) => rest),
      stats: stats,
      investmentChartData,
    };
  }
);
