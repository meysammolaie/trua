
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 */

import { ai } from '@/lib/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

const DistributeProfitsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  distributedAmount: z.number().optional(),
  investorCount: z.number().optional(),
});

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
      // 1. Get all active investments and platform settings
      const settings = await getPlatformSettings();
      const investmentsRef = collection(db, 'investments');
      const activeInvestmentsQuery = query(investmentsRef, where('status', '==', 'active'));

      const [investmentsSnapshot] = await Promise.all([
        getDocs(activeInvestmentsQuery),
      ]);

      const activeInvestments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (activeInvestments.length === 0) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }

      // 2. Calculate the total profit pool and total investment amount
      // Simplified: Profit pool is based on entry fees of all active investments.
      // A more robust system would track fees in a separate ledger.
      let totalProfitPool = 0;
      let totalInvestmentAmount = 0;
      const investmentsByUser: Record<string, number> = {};

      activeInvestments.forEach(inv => {
        const amount = inv.amount as number;
        const profitFromInvestment = amount * (settings.entryFee / 100);
        totalProfitPool += profitFromInvestment;
        totalInvestmentAmount += amount;

        const userId = inv.userId as string;
        if (!investmentsByUser[userId]) {
            investmentsByUser[userId] = 0;
        }
        investmentsByUser[userId] += amount;
      });

      if (totalProfitPool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود وجود ندارد.' };
      }

      // 3. Distribute profit and prepare batch write
      const batch = writeBatch(db);
      const investorCount = Object.keys(investmentsByUser).length;

      for (const userId in investmentsByUser) {
        const userTotalInvestment = investmentsByUser[userId];
        const profitShare = (userTotalInvestment / totalInvestmentAmount) * totalProfitPool;

        if (profitShare > 0) {
            // A. Update user's walletBalance
            const userRef = doc(db, 'users', userId);
            batch.update(userRef, { walletBalance: increment(profitShare) });

            // B. Create a transaction record for the profit payout
            const transactionRef = doc(collection(db, 'transactions'));
            batch.set(transactionRef, {
                userId,
                type: 'profit_payout',
                amount: profitShare,
                status: 'completed',
                createdAt: serverTimestamp(),
                details: `Profit distribution based on $${userTotalInvestment.toLocaleString()} investment.`,
            });
        }
      }

      // 4. Commit the batch write
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
