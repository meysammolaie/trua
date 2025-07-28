
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This is a critical flow that directly impacts user balances.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, Timestamp, runTransaction } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

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
    userId: string;
    amountUSD: number;
    netAmountUSD: number;
    createdAt: Timestamp;
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
      const settings = await getPlatformSettings();
      const investmentsRef = collection(db, 'investments');
      const allInvestmentsQuery = query(investmentsRef);

      const investmentsSnapshot = await getDocs(allInvestmentsQuery);
      
      const allInvestments = investmentsSnapshot.docs.map(doc => doc.data());
      const activeInvestments = allInvestments.filter(inv => inv.status === 'active');
      
      if (activeInvestments.length === 0) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }

      let totalFeePool = 0;
      allInvestments.forEach(inv => {
        if(inv.status === 'active' || inv.status === 'completed') {
            const entryFee = inv.amountUSD * (settings.entryFee / 100);
            totalFeePool += entryFee;
            if (inv.status === 'completed' && inv.exitFee) { // Assuming exitFee is stored on completion
                totalFeePool += inv.exitFee;
            }
        }
      });
      
      const dailyDistributablePool = totalFeePool * 0.05; 

      if (dailyDistributablePool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود وجود ندارد.' };
      }
      
      const totalActiveInvestmentAmount = activeInvestments.reduce((sum, inv) => sum + inv.netAmountUSD, 0);
      
      if (totalActiveInvestmentAmount <= 0) {
          return { success: true, message: 'مجموع سرمایه فعال برای محاسبه سهم سود صفر است.' };
      }
      
      const investmentsByUser = activeInvestments.reduce((acc, inv) => {
        if (!acc[inv.userId]) {
            acc[inv.userId] = 0;
        }
        acc[inv.userId] += inv.netAmountUSD;
        return acc;
      }, {} as Record<string, number>);

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
                amount: profitShare,
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

