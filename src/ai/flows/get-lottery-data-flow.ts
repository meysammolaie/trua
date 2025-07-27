
'use server';
/**
 * @fileOverview A flow for fetching all data for the admin lottery page.
 *
 * - getLotteryData - Fetches stats and recent winners.
 * - LotteryData - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

// Sub-schemas
const RecentWinnerSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    prizeAmount: z.number(),
    drawDate: z.string(),
});
export type RecentWinner = z.infer<typeof RecentWinnerSchema>;


// Main Output Schema
const LotteryDataSchema = z.object({
  lotteryPool: z.number(),
  totalTickets: z.number(),
  participantsCount: z.number(),
  recentWinners: z.array(RecentWinnerSchema),
});
export type LotteryData = z.infer<typeof LotteryDataSchema>;


export async function getLotteryData(): Promise<LotteryData> {
  return await getLotteryDataFlow({});
}

const getLotteryDataFlow = ai.defineFlow(
  {
    name: 'getLotteryDataFlow',
    inputSchema: z.object({}),
    outputSchema: LotteryDataSchema,
  },
  async () => {
    // 1. Fetch investments and recent winners in parallel
    const investmentsCollection = collection(db, "investments");
    const winnersCollection = collection(db, 'lottery_winners');

    const [investmentsSnapshot, winnersSnapshot] = await Promise.all([
      getDocs(investmentsCollection),
      getDocs(query(winnersCollection, orderBy("drawDate", "desc"), limit(3)))
    ]);
    
    // 2. Calculate stats from investments
    let totalInvestmentAmount = 0;
    const participants = new Set<string>();

    investmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amount || 0;
      const userId = data.userId;
      
      if (data.status === 'active' || data.status === 'pending') {
          totalInvestmentAmount += amount;
          if(userId) {
              participants.add(userId);
          }
      }
    });
    
    const lotteryPool = totalInvestmentAmount * 0.02; // 2% lottery fee
    const totalTickets = Math.floor(totalInvestmentAmount / 10); // 1 ticket per $10
    const participantsCount = participants.size;

    // 3. Map recent winners
    const recentWinners: RecentWinner[] = winnersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            prizeAmount: data.prizeAmount,
            drawDate: (data.drawDate as Timestamp).toDate().toLocaleDateString('fa-IR'),
        }
    })

    return {
      lotteryPool,
      totalTickets,
      participantsCount,
      recentWinners,
    };
  }
);
