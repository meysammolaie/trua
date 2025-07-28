
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This flow now uses the daily_fees ledger to ensure fees are only distributed once.
 */

import {genkit} from 'genkit';
import {z} from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const DistributeProfitsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  distributedAmount: z.number().optional(),
  investorCount: z.number().optional(),
});

type InvestmentDoc = {
    id: string;
    userId: string;
    netAmountUSD: number;
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
      // 1. Get all undistributed fees from the ledger
      const feesToDistributeQuery = query(collection(db, 'daily_fees'), where('distributed', '==', false));
      const feesSnapshot = await getDocs(feesToDistributeQuery);
      
      if (feesSnapshot.empty) {
        return { success: true, message: 'هیچ کارمزد جدیدی برای توزیع سود یافت نشد.' };
      }
      
      // 2. Calculate the total profit pool from the fee ledger.
      let dailyDistributablePool = 0;
      const feeDocsToUpdate: any[] = [];
      feesSnapshot.forEach(doc => {
          dailyDistributablePool += doc.data().amount || 0;
          feeDocsToUpdate.push(doc.ref);
      });
      
      if (dailyDistributablePool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود امروز وجود ندارد.' };
      }
      
      // 3. Get all *active* investments to determine profit shares.
      const allActiveInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(allActiveInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای دریافت سود یافت نشد.' };
      }
      
      const activeInvestments = activeInvestmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentDoc));
      const totalActiveInvestmentAmount = activeInvestments.reduce((sum, inv) => sum + inv.netAmountUSD, 0);
      
      if (totalActiveInvestmentAmount <= 0) {
          return { success: true, message: 'مجموع سرمایه فعال برای محاسبه سهم سود صفر است.' };
      }
      
      // Group investments by user to calculate their total investment.
      const investmentsByUser = activeInvestments.reduce((acc, inv) => {
        if (!acc[inv.userId]) {
            acc[inv.userId] = { totalInvestment: 0 };
        }
        acc[inv.userId].totalInvestment += inv.netAmountUSD;
        return acc;
      }, {} as Record<string, { totalInvestment: number }>);

      const batch = writeBatch(db);
      const investorCount = Object.keys(investmentsByUser).length;

      // 4. Distribute profits to each user based on their share.
      for (const userId in investmentsByUser) {
        const userTotalInvestment = investmentsByUser[userId].totalInvestment;
        const profitShare = (userTotalInvestment / totalActiveInvestmentAmount) * dailyDistributablePool;

        if (profitShare > 0) {
            const transactionRef = doc(collection(db, 'transactions'));
            // Create a transaction record for this profit payout. This will increase the user's withdrawable balance.
            batch.set(transactionRef, {
                userId,
                type: 'profit_payout',
                amount: profitShare, 
                status: 'completed',
                createdAt: serverTimestamp(),
                details: `سود روزانه بر اساس سرمایه خالص $${userTotalInvestment.toLocaleString()}`,
            });
        }
      }

      // 5. IMPORTANT: Mark all processed fee documents as 'distributed' so they are not included in the next run.
      feeDocsToUpdate.forEach(ref => {
          batch.update(ref, { distributed: true });
      });

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
