
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This flow calculates the profit pool from all undistributed entry/exit fees.
 */

import { genkit } from 'genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
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
};

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
      const batch = writeBatch(db);

      // 1. Get all undistributed entry and exit fees to form the profit pool
      const feesQuery = query(collection(db, 'daily_fees'), where('distributed', '==', false), where('type', 'in', ['entry_fee', 'exit_fee']));
      const feesSnapshot = await getDocs(feesQuery);

      if (feesSnapshot.empty) {
        return { success: true, message: 'هیچ کارمزد جدیدی برای توزیع سود یافت نشد.' };
      }

      const totalProfitPool = feesSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      
      if (totalProfitPool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود امروز وجود ندارد.' };
      }

      // 2. Get all active investments to determine profit shares
      const activeInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(activeInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
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

      const investorCount = Object.keys(investmentsByUser).length;

      // 3. Distribute profits to each user based on their share.
      for (const userId in investmentsByUser) {
        const userTotalInvestment = investmentsByUser[userId].totalInvestment;
        const profitShare = (userTotalInvestment / totalActiveInvestmentAmount) * totalProfitPool;

        if (profitShare > 0) {
            const transactionRef = doc(collection(db, 'transactions'));
            // This transaction increases the user's withdrawable balance.
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
      
      // 4. Mark all processed fees as distributed.
      feesSnapshot.forEach(feeDoc => {
          batch.update(feeDoc.ref, { distributed: true });
      });

      await batch.commit();

      return {
        success: true,
        message: `مبلغ ${totalProfitPool.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} با موفقیت بین ${investorCount} سرمایه‌گذار توزیع شد.`,
        distributedAmount: totalProfitPool,
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
