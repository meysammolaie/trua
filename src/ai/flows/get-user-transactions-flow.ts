
'use server';
/**
 * @fileOverview A flow for fetching a user's transactions and stats from Firestore.
 *
 * - getUserTransactions - Fetches all transactions and calculates stats for a given user.
 * - GetUserTransactionsInput - The input type for the getUserTransactions function.
 * - GetUserTransactionsOutput - The return type for the getUserTransactions function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

const GetUserTransactionsInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose transactions are to be fetched.'),
});
export type GetUserTransactionsInput = z.infer<typeof GetUserTransactionsInputSchema>;

const TransactionSchema = z.object({
    id: z.string(),
    type: z.string(),
    fund: z.string(),
    status: z.string(),
    date: z.string(),
    amount: z.number(),
});

const StatsSchema = z.object({
    totalInvestment: z.number(),
    totalProfit: z.number(),
    lotteryTickets: z.number(),
    walletBalance: z.number(),
});

const GetUserTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionSchema),
  stats: StatsSchema,
});
export type GetUserTransactionsOutput = z.infer<typeof GetUserTransactionsOutputSchema>;

// Firestore data structure for an investment
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
    gold: "طلا",
    silver: "نقره",
    usdt: "تتر",
    bitcoin: "بیت‌کوین"
};

const statusNames: Record<string, string> = {
    pending: "در انتظار",
    active: "فعال",
    completed: "خاتمه یافته",
};

export async function getUserTransactions(input: GetUserTransactionsInput): Promise<GetUserTransactionsOutput> {
  return await getUserTransactionsFlow(input);
}

const getUserTransactionsFlow = ai.defineFlow(
  {
    name: 'getUserTransactionsFlow',
    inputSchema: GetUserTransactionsInputSchema,
    outputSchema: GetUserTransactionsOutputSchema,
  },
  async ({ userId }) => {
    
    const investmentsCollection = collection(db, "investments");
    const q = query(
        investmentsCollection, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    
    let totalInvestment = 0;
    const lotteryTicketRatio = 10; // $10 for 1 ticket

    const investmentsData = querySnapshot.docs.map(doc => {
        const data = doc.data() as InvestmentDocument;
        if (data.status === 'active' || data.status === 'pending') {
            totalInvestment += data.amount;
        }
        return {
            id: doc.id,
            type: "سرمایه‌گذاری",
            fund: fundNames[data.fundId as keyof typeof fundNames] || data.fundId,
            status: statusNames[data.status as keyof typeof statusNames] || data.status,
            date: data.createdAt.toDate().toLocaleDateString('fa-IR'),
            // Make amount negative to show it as an expense/outgoing transaction
            amount: -Math.abs(data.amount), 
        };
    });

    // In a real app, you would fetch other transaction types (profits, withdrawals, etc.)
    // and merge them with investments, then sort by date.
    // For now, we only have investments.

    const stats: z.infer<typeof StatsSchema> = {
        totalInvestment: totalInvestment,
        totalProfit: 0, // Not implemented yet
        lotteryTickets: Math.floor(totalInvestment / lotteryTicketRatio),
        walletBalance: 0, // Not implemented yet
    };

    return {
      transactions: investmentsData,
      stats: stats
    };
  }
);
