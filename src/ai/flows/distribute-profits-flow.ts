
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors.
 * This flow should be run daily. It calculates profits based on fees from
 * investments activated on the same day.
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
      
      const allActiveInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(allActiveInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }
      
      let dailyDistributablePool = 0;
      const activeInvestments: (InvestmentDoc & {ref: any})[] = [];

      activeInvestmentsSnapshot.docs.forEach(doc => {
          const investment = doc.data() as InvestmentDoc;
          dailyDistributablePool += investment.feesUSD || 0;
          activeInvestments.push({ ...investment, id: doc.id, ref: doc.ref });
      });
      
      if (dailyDistributablePool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود امروز وجود ندارد.' };
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

      // Mark all processed investments as 'completed' so they aren't included in the next run
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
