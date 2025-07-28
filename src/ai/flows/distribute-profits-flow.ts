
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
    amountUSD: number;
    netAmountUSD: number;
    feesUSD: number;
    status: 'pending' | 'active' | 'completed' | 'rejected';
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
      
      const investmentsRef = collection(db, 'investments');
      const allInvestmentsQuery = query(investmentsRef, where('status', '==', 'active'));
      const activeInvestmentsSnapshot = await getDocs(allInvestmentsQuery);
      
      if (activeInvestmentsSnapshot.empty) {
        return { success: true, message: 'هیچ سرمایه‌گذار فعالی برای توزیع سود یافت نشد.' };
      }

      // Calculate the total profit pool from the fees of ALL investments ever made
      const allTimeInvestmentsSnapshot = await getDocs(collection(db, 'investments'));
      let totalFeePool = allTimeInvestmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().feesUSD || 0), 0);
      
      // Assume we distribute 5% of the total collected fees daily.
      // This is a simplified model. A real system would track the "undistributed" fee pool.
      const dailyDistributablePool = totalFeePool * 0.05; 

      if (dailyDistributablePool <= 0) {
         return { success: true, message: 'مبلغی برای توزیع سود وجود ندارد.' };
      }
      
      const activeInvestments = activeInvestmentsSnapshot.docs.map(doc => doc.data() as InvestmentDoc);
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
