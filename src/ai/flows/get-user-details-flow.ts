
'use server';
/**
 * @fileOverview A flow for fetching all details for a single user.
 * This is the single source of truth for user financial data.
 * It calculates balances in real-time based on the transaction ledger.
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
    amount: number; // Can be positive (credit) or negative (debit)
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

const transactionTypeNames: Record<string, string> = {
    investment: "سرمایه‌گذاری",
    profit_payout: "واریز سود",
    commission: "کمیسیون",
    principal_return: "بازگشت اصل پول",
    withdrawal_request: "درخواست برداشت",
    bonus: "جایزه"
};

const transactionStatusNames: Record<string, string> = {
    pending: "در انتظار",
    active: "فعال",
    completed: "تکمیل شده",
    rejected: "رد شده",
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
    
    // 1. Fetch all user-related data in parallel
    const userDocRef = doc(db, "users", userId);
    const investmentsQuery = query(collection(db, "investments"), where("userId", "==", userId));
    const dbTransactionsQuery = query(collection(db, "transactions"), where("userId", "==", userId));
    const bonusQuery = query(collection(db, "bonuses"), where("userId", "==", userId), where("status", "==", "locked"));

    const [userDoc, investmentsSnapshot, dbTransactionsSnapshot, bonusSnapshot] = await Promise.all([
        getDoc(userDocRef),
        getDocs(investmentsQuery),
        getDocs(dbTransactionsQuery),
        getDocs(bonusQuery)
    ]);
    
    if (!userDoc.exists()) {
        console.warn(`User document with ID ${userId} not found. Returning empty profile.`);
        // Return a default, empty object to prevent crashes on other parts of the system
        return {
            profile: {
                uid: userId,
                firstName: 'کاربر',
                lastName: 'نامشخص',
                email: 'نامشخص',
                createdAt: '-',
                status: 'blocked',
            },
            transactions: [],
            stats: {
                activeInvestment: 0,
                totalProfit: 0,
                lotteryTickets: 0,
                walletBalance: 0,
                totalBalance: 0,
                lockedBonus: 0,
            },
            investmentChartData: [],
        };
    }
    const userData = userDoc.data();
    
    // 2. Calculate Stats
    
    // 2.1. Active Investment (Net amount)
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

    // Add investment records to the combined history for display
    investmentsSnapshot.docs.forEach(doc => {
        const data = doc.data() as InvestmentDocument;
        const createdAt = data.createdAt.toDate();
        allTransactionsForHistory.push({
            id: doc.id,
            type: transactionTypeNames["investment"],
            fund: fundNames[data.fundId as keyof typeof fundNames] || data.fundId,
            status: transactionStatusNames[data.status as keyof typeof transactionStatusNames] || data.status,
            date: createdAt.toLocaleDateString('fa-IR'),
            amount: -Math.abs(data.amountUSD), // Investments are shown as debits in history
            timestamp: createdAt.getTime(),
            proof: data.transactionHash
        });
    });

    // 2.2. Wallet Balance and Total Profit (Calculated from the transaction ledger)
    let walletBalance = 0;
    let totalProfit = 0;

    dbTransactionsSnapshot.docs.forEach(doc => {
        const data = doc.data() as DbTransactionDocument;
        const createdAt = data.createdAt.toDate();
        
        // Add or subtract from balance based on the transaction amount and status
        if (data.status === 'completed' || data.status === 'pending') {
            walletBalance += data.amount;
        }

        // Calculate total profit separately for display
        if (data.type === 'profit_payout' && data.status === 'completed') {
            totalProfit += data.amount;
        }
        
        // Add DB transactions to the combined history for display
        allTransactionsForHistory.push({
            id: doc.id,
            type: transactionTypeNames[data.type as keyof typeof transactionTypeNames] || data.type,
            fund: data.details || '-',
            status: transactionStatusNames[data.status as keyof typeof transactionStatusNames] || data.status || 'تکمیل شده',
            date: createdAt.toLocaleDateString('fa-IR'),
            amount: data.amount,
            timestamp: createdAt.getTime(),
            proof: data.proof,
        });
    })
    
    // 2.3. Locked Bonus
    const lockedBonus = bonusSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

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

    // 4. Assemble Final Output
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
        walletBalance: walletBalance, 
        totalBalance: activeNetInvestment + walletBalance,
        lockedBonus: lockedBonus,
    };
    
    // Sort combined history by date
    const sortedTransactions = allTransactionsForHistory.sort((a,b) => b.timestamp - a.timestamp);

    return {
      profile,
      transactions: sortedTransactions.map(({timestamp, ...rest}) => rest),
      stats: stats,
      investmentChartData,
    };
  }
);
