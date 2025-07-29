
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors, handled separately for each fund.
 * This flow calculates the profit pool from all undistributed entry/exit fees for each fund
 * and distributes it to the active investors of that specific fund based on a weighted score
 * of their investment amount and duration.
 */

import { genkit } from 'genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const DistributeProfitsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.array(z.object({
    fundId: z.string(),
    distributedAmount: z.number(),
    investorCount: z.number(),
  })).optional(),
});

type InvestmentDoc = {
    id: string;
    userId: string;
    fundId: string;
    netAmountUSD: number;
    createdAt: Timestamp;
};

const FUNDS = ['gold', 'silver', 'usdt', 'bitcoin'];

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
    const overallBatch = writeBatch(db);
    const overallDetails: z.infer<typeof DistributeProfitsOutputSchema>['details'] = [];
    let totalDistributedAmount = 0;
    const now = new Date();

    try {
        // 1. Get all active investments across all funds first
        const allActiveInvestmentsQuery = query(collection(db, 'investments'), where('status', '==', 'active'));
        const allActiveInvestmentsSnapshot = await getDocs(allActiveInvestmentsQuery);
        const allActiveInvestments = allActiveInvestmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentDoc));

        // 2. Get all undistributed fees
        const allFeesQuery = query(collection(db, 'daily_fees'), where('distributed', '==', false), where('type', 'in', ['entry_fee', 'exit_fee']));
        const allFeesSnapshot = await getDocs(allFeesQuery);
        const allUndistributedFees = allFeesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));


        // Process each fund separately
        for (const fundId of FUNDS) {
            // 3. Filter investments for the current fund
            const fundActiveInvestments = allActiveInvestments.filter(inv => inv.fundId === fundId);

            if (fundActiveInvestments.length === 0) {
                console.log(`No active investments for fund ${fundId}. Skipping.`);
                continue;
            }

            // 4. Filter fees for the current fund to form its profit pool
            const fundFees = allUndistributedFees.filter(fee => fee.fundId === fundId);

            if (fundFees.length === 0) {
                console.log(`No new fees to distribute for fund ${fundId}. Skipping.`);
                continue;
            }
            
            const fundProfitPool = fundFees.reduce((sum, doc) => sum + doc.amount, 0);
            
            if (fundProfitPool <= 0) {
                console.log(`Profit pool for fund ${fundId} is zero or negative. Skipping.`);
                continue;
            }
            
            // 5. NEW LOGIC: Calculate weighted scores for each investment
            const weightedInvestments = fundActiveInvestments.map(inv => {
                const investmentDate = inv.createdAt.toDate();
                const daysActive = Math.max(1, (now.getTime() - investmentDate.getTime()) / (1000 * 3600 * 24)); // Minimum 1 day
                const weightedScore = inv.netAmountUSD * daysActive;
                return { ...inv, weightedScore };
            });

            const totalWeightedScore = weightedInvestments.reduce((sum, inv) => sum + inv.weightedScore, 0);

            if (totalWeightedScore <= 0) {
                console.log(`Total weighted score for fund ${fundId} is zero. Cannot distribute profits.`);
                continue;
            }

            // 6. Group investments by user for this fund and calculate total weighted score per user
            const investmentsByUser = weightedInvestments.reduce((acc, inv) => {
                if (!acc[inv.userId]) {
                    acc[inv.userId] = { totalWeightedScore: 0 };
                }
                acc[inv.userId].totalWeightedScore += inv.weightedScore;
                return acc;
            }, {} as Record<string, { totalWeightedScore: number }>);
            
            const fundInvestorCount = Object.keys(investmentsByUser).length;

            // 7. Distribute profits to each user based on their weighted share in this fund
            for (const userId in investmentsByUser) {
                const userTotalWeightedScore = investmentsByUser[userId].totalWeightedScore;
                const profitShare = (userTotalWeightedScore / totalWeightedScore) * fundProfitPool;

                if (profitShare > 0) {
                    const transactionRef = doc(collection(db, 'transactions'));
                    overallBatch.set(transactionRef, {
                        userId,
                        type: 'profit_payout',
                        amount: profitShare,
                        status: 'completed',
                        createdAt: serverTimestamp(),
                        details: `سود روزانه از صندوق ${fundId}`,
                        fundId: fundId,
                    });
                }
            }
            
            // 8. Mark processed fees for this fund as distributed
            fundFees.forEach(feeDoc => {
                const feeRef = doc(db, 'daily_fees', feeDoc.id);
                overallBatch.update(feeRef, { distributed: true });
            });

            totalDistributedAmount += fundProfitPool;
            overallDetails.push({
                fundId,
                distributedAmount: fundProfitPool,
                investorCount: fundInvestorCount,
            });
        }
        
        if (totalDistributedAmount === 0) {
            return { success: true, message: 'هیچ سود جدیدی برای توزیع در هیچ‌کدام از صندوق‌ها یافت نشد.' };
        }
      
        await overallBatch.commit();

        return {
            success: true,
            message: `مبلغ ${totalDistributedAmount.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} با موفقیت بین صندوق‌ها توزیع شد.`,
            details: overallDetails,
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
