
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This flow now calculates the profit pool from all active investments' fees and distributes it.
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
    netAmountUSD: number; // Net investment after entry fees
    feesUSD: number; // Total fees collected from this investment
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
      // 1. Get all *active* investments to determine the profit pool and profit shares.
      const allActiveInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(allActiveInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }
      
      const activeInvestments = activeInvestmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentDoc));
      
      // 2. Calculate the total profit pool from all fees of active investments.
      const totalProfitPool = activeInvestments.reduce((sum, inv) => sum + (inv.feesUSD || 0), 0);
      
      if (totalProfitPool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود امروز وجود ندارد.' };
      }

      // 3. Calculate the total active investment amount to determine shares.
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
      
      // Mark all investments as 'completed' so their fees are not re-distributed.
      // This is a critical step to prevent double-counting fees.
      activeInvestments.forEach(inv => {
          const invRef = doc(db, 'investments', inv.id);
          batch.update(invRef, { status: 'completed', updatedAt: serverTimestamp() });
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
