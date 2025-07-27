
'use server';
/**
 * @fileOverview A flow for fetching all details for a single user.
 *
 * - getUserDetails - Fetches profile, stats, and transactions for a given user.
 * - GetUserDetailsInput - The input type for the getUserDetails function.
 * - GetUserDetailsOutput - The return type for the getUserDetails function.
 */

import {ai} from '@/lib/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';


const GetUserDetailsInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose details are to be fetched.'),
});
export type GetUserDetailsInput = z.infer<typeof GetUserDetailsInputSchema>;

const UserProfileSchema = z.object({
    uid: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    createdAt: z.string(),
    status: z.enum(['active', 'blocked']),
});

const TransactionSchema = z.object({
    id: z.string(),
    type: z.string(),
    fund: z.string(),
    status: z.string(),
    date: z.string(),
    amount: z.number(),
});

const ChartDataPointSchema = z.object({
  month: z.string(),
  investment: z.number(),
});

const StatsSchema = z.object({
    totalInvestment: z.number(),
    totalProfit: z.number(),
    lotteryTickets: z.number(),
    walletBalance: z.number(),
});

const GetUserDetailsOutputSchema = z.object({
  profile: UserProfileSchema,
  transactions: z.array(TransactionSchema),
  stats: StatsSchema,
  investmentChartData: z.array(ChartDataPointSchema),
});
export type GetUserDetailsOutput = z.infer<typeof GetUserDetailsOutputSchema>;

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
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
    
    // 1. Fetch user profile and investments in parallel
    const userDocRef = doc(db, "users", userId);
    const investmentsCollection = collection(db, "investments");
    const investmentsQuery = query(
        investmentsCollection, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const [userDoc, investmentsSnapshot] = await Promise.all([
        getDoc(userDocRef),
        getDocs(investmentsQuery),
    ]);
    
    if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
    }
    const userData = userDoc.data();
    
    // 2. Process investments and calculate stats
    let totalInvestment = 0;
    const lotteryTicketRatio = 10; // $10 for 1 ticket
    const investmentByMonth: Record<string, number> = {};

    const transactionsData = investmentsSnapshot.docs.map(doc => {
        const data = doc.data() as InvestmentDocument;
        if (data.status === 'active' || data.status === 'pending') {
            totalInvestment += data.amount;

            // For chart data
            const date = data.createdAt.toDate();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if(!investmentByMonth[monthKey]) {
                investmentByMonth[monthKey] = 0;
            }
            investmentByMonth[monthKey] += data.amount;
        }
        return {
            id: doc.id,
            type: "سرمایه‌گذاری",
            fund: fundNames[data.fundId as keyof typeof fundNames] || data.fundId,
            status: statusNames[data.status as keyof typeof statusNames] || data.status,
            date: data.createdAt.toDate().toLocaleDateString('fa-IR'),
            amount: -Math.abs(data.amount), 
        };
    });

    // 3. Prepare Chart Data
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


    // 4. Assemble final output
    const profile: z.infer<typeof UserProfileSchema> = {
        uid: userDoc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        createdAt: (userData.createdAt as Timestamp).toDate().toLocaleDateString('fa-IR'),
        status: userData.status || 'active',
    };

    const stats: z.infer<typeof StatsSchema> = {
        totalInvestment: totalInvestment,
        totalProfit: 0, // Not implemented yet
        lotteryTickets: Math.floor(totalInvestment / lotteryTicketRatio),
        walletBalance: userData.walletBalance || 0,
    };

    return {
      profile,
      transactions: transactionsData,
      stats: stats,
      investmentChartData,
    };
  }
);
