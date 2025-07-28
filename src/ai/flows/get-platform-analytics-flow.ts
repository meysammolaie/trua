
'use server';
/**
 * @fileOverview A flow for fetching platform-wide analytics.
 *
 * - getPlatformAnalytics - Fetches and computes all stats and chart data for the platform.
 * - PlatformAnalyticsData - The return type for the function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

const ai = genkit({
  plugins: [googleAI()],
});

// Schemas
const FundStatSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalValue: z.number(),
});

const GrowthDataPointSchema = z.object({
  date: z.string(),
  tvl: z.number(),
});

const PlatformAnalyticsDataSchema = z.object({
  totalTVL: z.number(),
  lotteryPool: z.number(),
  activeInvestors: z.number(),
  potentialDailyProfit: z.number(),
  fundStats: z.array(FundStatSchema),
  tvlGrowthData: z.array(GrowthDataPointSchema),
});
export type PlatformAnalyticsData = z.infer<typeof PlatformAnalyticsDataSchema>;

// Firestore Document Types
type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed';
  createdAt: Timestamp;
};

const fundNames: Record<string, string> = {
    gold: "طلا",
    silver: "نقره",
    usdt: "تتر",
    bitcoin: "بیت‌کوین"
};


export async function getPlatformAnalytics(): Promise<PlatformAnalyticsData> {
  return await getPlatformAnalyticsFlow({});
}

const getPlatformAnalyticsFlow = ai.defineFlow(
  {
    name: 'getPlatformAnalyticsFlow',
    inputSchema: z.object({}),
    outputSchema: PlatformAnalyticsDataSchema,
  },
  async () => {
    // 1. Fetch all investments and platform settings in parallel
    const investmentsCollection = collection(db, "investments");
    
    const [investmentsSnapshot, settings] = await Promise.all([
      getDocs(investmentsCollection), // Fetch all investments without a complex query
      getPlatformSettings()
    ]);

    // Filter and sort in code instead of in the query
    const allInvestments = investmentsSnapshot.docs.map(doc => doc.data() as InvestmentDocument);
    const activeInvestments = allInvestments
        .filter(inv => inv.status === 'active')
        .sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis()); // Sort ascending

    // 2. Calculate Stats
    let totalTVL = 0;
    let lotteryPool = 0;
    const investors = new Set<string>();
    const fundTotals: Record<string, number> = { gold: 0, silver: 0, usdt: 0, bitcoin: 0 };
    const tvlByDate: Record<string, number> = {};

    activeInvestments.forEach(inv => {
        totalTVL += inv.amount;
        lotteryPool += inv.amount * (settings.lotteryFee / 100);
        investors.add(inv.userId);
        
        if (fundTotals[inv.fundId] !== undefined) {
            fundTotals[inv.fundId] += inv.amount;
        }

        const dateKey = inv.createdAt.toDate().toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' });
        if (!tvlByDate[dateKey]) {
            tvlByDate[dateKey] = 0;
        }
        tvlByDate[dateKey] += inv.amount;
    });

    const fundStats = Object.entries(fundTotals).map(([id, totalValue]) => ({
      id,
      name: fundNames[id] || id,
      totalValue
    }));
    
    // Create cumulative growth data
    let cumulativeTvl = 0;
    const tvlGrowthData = Object.entries(tvlByDate).map(([date, value]) => {
        cumulativeTvl += value;
        return { date, tvl: cumulativeTvl };
    });

    // 3. Estimate daily profit
    // This is a simplified estimation. A real system would track fee income separately.
    // We'll estimate it as a percentage of TVL for demonstration.
    const estimatedDailyProfitRate = 0.005; // 0.5% daily profit rate example
    const potentialDailyProfit = totalTVL * estimatedDailyProfitRate;


    return {
      totalTVL,
      lotteryPool,
      activeInvestors: investors.size,
      potentialDailyProfit,
      fundStats,
      tvlGrowthData,
    };
  }
);
