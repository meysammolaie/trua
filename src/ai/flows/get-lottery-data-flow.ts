
'use server';
/**
 * @fileOverview A flow for fetching all data for the admin lottery page.
 *
 * - getLotteryData - Fetches stats and recent winners.
 * - LotteryData - The return type for the function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, Timestamp, where } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

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

type DailyFeeDocument = {
    id: string;
    type: 'entry_fee' | 'exit_fee' | 'lottery_fee' | 'platform_fee';
    amount: number;
    distributed: boolean;
    fundId: string;
}

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
    // 1. Fetch investments, recent winners, and lottery fees in parallel
    const investmentsCollection = collection(db, "investments");
    const winnersCollection = collection(db, 'lottery_winners');
    const feesQuery = query(collection(db, 'daily_fees'), where('type', '==', 'lottery_fee'));


    const [investmentsSnapshot, winnersSnapshot, feesSnapshot] = await Promise.all([
      getDocs(query(investmentsCollection, where('status', 'in', ['active', 'pending']))),
      getDocs(query(winnersCollection, orderBy("drawDate", "desc"), limit(3))),
      getDocs(feesQuery),
    ]);
    
    // 2. Calculate stats from investments
    let totalInvestmentAmount = 0;
    const participants = new Set<string>();

    investmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amountUSD || 0; // Use amountUSD for accurate calculation
      const userId = data.userId;
      
      if(userId) {
          participants.add(userId);
      }
      totalInvestmentAmount += amount;
    });
    
    // NEW: Accurate lottery pool calculation from the fee ledger
    const lotteryPool = feesSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

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
            drawDate: (data.drawDate as Timestamp).toDate().toLocaleDateString('en-US'),
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
