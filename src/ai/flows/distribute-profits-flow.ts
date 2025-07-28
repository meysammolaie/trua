
'use server';
/**
 * @fileOverview A flow for calculating and distributing profits to investors, handled separately for each fund.
 * This flow calculates the profit pool from all undistributed entry/exit fees for each fund
 * and distributes it to the active investors of that specific fund.
 */

import { genkit } from 'genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

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

            // 5. Calculate total investment amount for this specific fund
            const fundTotalActiveInvestmentAmount = fundActiveInvestments.reduce((sum, inv) => sum + inv.netAmountUSD, 0);

            if (fundTotalActiveInvestmentAmount <= 0) {
                console.log(`Total active investment for fund ${fundId} is zero. Cannot distribute profits.`);
                continue;
            }

            // 6. Group investments by user for this fund
            const investmentsByUser = fundActiveInvestments.reduce((acc, inv) => {
                if (!acc[inv.userId]) {
                    acc[inv.userId] = { totalInvestment: 0 };
                }
                acc[inv.userId].totalInvestment += inv.netAmountUSD;
                return acc;
            }, {} as Record<string, { totalInvestment: number }>);
            
            const fundInvestorCount = Object.keys(investmentsByUser).length;

            // 7. Distribute profits to each user based on their share in this fund
            for (const userId in investmentsByUser) {
                const userTotalInvestmentInFund = investmentsByUser[userId].totalInvestment;
                const profitShare = (userTotalInvestmentInFund / fundTotalActiveInvestmentAmount) * fundProfitPool;

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
