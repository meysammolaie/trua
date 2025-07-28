
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This flow should be run daily. It calculates profits based on fees from
 * all active investments and then marks them as completed to avoid double-counting.
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
    amountUSD: number;
    netAmountUSD: number;
    feesUSD: number;
    status: 'pending' | 'active' | 'completed' | 'rejected';
    createdAt: Timestamp;
    updatedAt?: Timestamp; 
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
      // 1. Get all *active* investments. These are the ones that will contribute to and receive profit.
      const allActiveInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(allActiveInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }
      
      // 2. Calculate the total profit pool from the fees of all active investments.
      let dailyDistributablePool = 0;
      const activeInvestments: (InvestmentDoc & {ref: any})[] = [];

      activeInvestmentsSnapshot.docs.forEach(doc => {
          const investment = doc.data() as InvestmentDoc;
          // The profit pool is the sum of all fees collected from these investments.
          dailyDistributablePool += investment.feesUSD || 0;
          activeInvestments.push({ ...investment, id: doc.id, ref: doc.ref });
      });
      
      if (dailyDistributablePool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود امروز وجود ندارد.' };
      }
      
      // 3. Calculate the total net investment amount to determine profit shares.
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

      // 5. IMPORTANT: Mark all processed investments as 'completed' so they are not included in the next run.
      activeInvestments.forEach(inv => {
          batch.update(inv.ref, { status: 'completed', updatedAt: serverTimestamp() });
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
