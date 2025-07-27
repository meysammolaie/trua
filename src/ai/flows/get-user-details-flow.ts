
'use server';
/**
 * @fileOverview A flow for fetching all details for a single user.
 *
 * - getUserDetails - Fetches profile, stats, and transactions for a given user.
 * - GetUserDetailsInput - The input type for the getUserDetails function.
 * - GetUserDetailsOutput - The return type for the getUserDetails function.
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
  amount: number;
  amountUSD: number; // Gross amount in USD
  netAmountUSD?: number; // Net amount after fees
  status: 'pending' | 'active' | 'completed';
  createdAt: Timestamp;
  transactionHash: string;
};

type DbTransactionDocument = {
    id: string;
    userId: string;
    type: string;
    amount: number;
    status: 'completed';
    createdAt: Timestamp;
    details?: string;
    proof?: string;
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
    
    // 1. Fetch user profile, investments, and other transactions in parallel
    const userDocRef = doc(db, "users", userId);
    const investmentsCollection = collection(db, "investments");
    const dbTransactionsCollection = collection(db, "transactions");

    const investmentsQuery = query(
        investmentsCollection, 
        where("userId", "==", userId)
    );
     const dbTransactionsQuery = query(
        dbTransactionsCollection, 
        where("userId", "==", userId)
    );

    const [userDoc, investmentsSnapshot, dbTransactionsSnapshot] = await Promise.all([
        getDoc(userDocRef),
        getDocs(investmentsQuery),
        getDocs(dbTransactionsQuery),
    ]);
    
    if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
    }
    const userData = userDoc.data();
    
    // 2. Process investments and calculate stats
    let grossInvestment = 0;
    let netInvestment = 0;
    const lotteryTicketRatio = 10; // $10 for 1 ticket
    const investmentByMonth: Record<string, number> = {};
    const allTransactions: (z.infer<typeof TransactionSchema> & { timestamp: number })[] = [];

    investmentsSnapshot.docs.forEach(doc => {
        const data = doc.data() as InvestmentDocument;
        const transactionAmount = data.netAmountUSD ?? data.amountUSD;
        const createdAt = data.createdAt.toDate();

        if (data.status === 'active' || data.status === 'pending') {
            grossInvestment += data.amountUSD;
            netInvestment += transactionAmount;

            const date = data.createdAt.toDate();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if(!investmentByMonth[monthKey]) {
                investmentByMonth[monthKey] = 0;
            }
            investmentByMonth[monthKey] += data.amountUSD; // Use gross for chart
        }
        allTransactions.push({
            id: doc.id,
            type: "investment",
            fund: fundNames[data.fundId as keyof typeof fundNames] || data.fundId,
            status: statusNames[data.status as keyof typeof statusNames] || data.status,
            date: createdAt.toLocaleDateString('fa-IR'),
            amount: -Math.abs(data.amountUSD), // Show gross amount
            timestamp: createdAt.getTime(),
            proof: data.transactionHash
        });
    });

    // 3. Process other transactions (profits, withdrawals)
    let totalProfit = 0;
    dbTransactionsSnapshot.docs.forEach(doc => {
        const data = doc.data() as DbTransactionDocument;
        const createdAt = data.createdAt.toDate();
        if (data.type === 'profit_payout') {
            totalProfit += data.amount;
        }

        allTransactions.push({
            id: doc.id,
            type: data.type,
            fund: data.details || '-',
            status: 'تکمیل شده',
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
    
    // Per user request: walletBalance = grossInvestment + totalProfit
    const calculatedWalletBalance = grossInvestment + totalProfit;

    const stats: z.infer<typeof StatsSchema> = {
        grossInvestment: grossInvestment,
        netInvestment: netInvestment,
        totalProfit: totalProfit,
        lotteryTickets: Math.floor(grossInvestment / lotteryTicketRatio),
        walletBalance: calculatedWalletBalance,
    };
    
    const sortedTransactions = allTransactions.sort((a,b) => b.timestamp - a.timestamp);

    return {
      profile,
      transactions: sortedTransactions.map(({timestamp, ...rest}) => rest), // remove timestamp before returning
      stats: stats,
      investmentChartData,
    };
  }
);
