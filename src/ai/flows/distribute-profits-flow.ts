
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This flow should be run daily. It calculates profits based on fees from
 * investments activated on the same day.
 */

import {genkit} from 'genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, Timestamp, collectionGroup } from 'firebase/firestore';

const DistributeProfitsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  distributedAmount: z.number().optional(),
  investorCount: z.number().optional(),
});

type InvestmentDoc = {
    id: string;
    userId: string;
    amountUSD: number;
    netAmountUSD: number;
    feesUSD: number;
    status: 'pending' | 'active' | 'completed' | 'rejected';
    createdAt: Timestamp;
    updatedAt?: Timestamp; // Assuming there's an updatedAt field when status changes to 'active'
}

export async function distributeProfits(): Promise<z.infer<typeof DistributeProfitsOutputSchema>> {
  return await distributeProfitsFlow({});
}

const distributeProfitsFlow = ai.defineFlow(
  {
    name: 'distributeProfitsFlow',
    inputSchema: z.object({}),
    outputSchema: DistributeProfitsOutputSchema,
  },
  async () => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // 1. Calculate today's profit pool from investments activated today.
      const investmentsRef = collection(db, 'investments');
      const q = query(investmentsRef, 
        where('status', '==', 'active'),
        where('updatedAt', '>=', startOfToday),
        where('updatedAt', '<', endOfToday)
      );

      const todaysActivatedInvestments = await getDocs(q);

      const dailyDistributablePool = todaysActivatedInvestments.docs.reduce((sum, doc) => {
        // Assuming entry fee is the primary source for the profit pool
        const fees = doc.data().feesUSD || 0;
        const amount = doc.data().amountUSD || 0;
        const platformFeeRate = 0.01;
        const lotteryFeeRate = 0.02;
        // This calculates the portion of fees that is the entry fee (3%)
        const entryFee = fees - (amount * (platformFeeRate + lotteryFeeRate));
        return sum + (entryFee > 0 ? entryFee : 0);
      }, 0);
      
      if (dailyDistributablePool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود امروز وجود ندارد.' };
      }
      
      // 2. Get all active investments to determine who gets profits and their share
      const allActiveInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(allActiveInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }

      const activeInvestments = activeInvestmentsSnapshot.docs.map(doc => doc.data() as InvestmentDoc);
      const totalActiveInvestmentAmount = activeInvestments.reduce((sum, inv) => sum + inv.netAmountUSD, 0);
      
      if (totalActiveInvestmentAmount <= 0) {
          return { success: true, message: 'مجموع سرمایه فعال برای محاسبه سهم سود صفر است.' };
      }
      
      // 3. Group investments by user to calculate total investment per user
      const investmentsByUser = activeInvestments.reduce((acc, inv) => {
        if (!acc[inv.userId]) {
            acc[inv.userId] = 0;
        }
        acc[inv.userId] += inv.netAmountUSD;
        return acc;
      }, {} as Record<string, number>);

      // 4. Create profit payout transactions in a batch
      const batch = writeBatch(db);
      const investorCount = Object.keys(investmentsByUser).length;

      for (const userId in investmentsByUser) {
        const userTotalInvestment = investmentsByUser[userId];
        const profitShare = (userTotalInvestment / totalActiveInvestmentAmount) * dailyDistributablePool;

        if (profitShare > 0) {
            const transactionRef = doc(collection(db, 'transactions'));
            batch.set(transactionRef, {
                userId,
                type: 'profit_payout',
                amount: profitShare, // Positive amount for credit
                status: 'completed',
                createdAt: serverTimestamp(),
                details: `سود روزانه بر اساس سرمایه خالص $${userTotalInvestment.toLocaleString()}`,
            });
        }
      }

      await batch.commit();

      return {
        success: true,
        message: `مبلغ ${dailyDistributablePool.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} با موفقیت بین ${investorCount} سرمایه‌گذار توزیع شد.`,
        distributedAmount: dailyDistributablePool,
        investorCount: investorCount,
      };

    } catch (error) {
      console.error("Error distributing profits:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      return {
        success: false,
        message: `خطایی در هنگام توزیع سود رخ داد: ${errorMessage}`,
      };
    }
  }
);
