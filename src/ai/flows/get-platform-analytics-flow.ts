
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
  investorCount: z.number(),
});

const GrowthDataPointSchema = z.object({
  date: z.string(),
  tvl: z.number(),
});

const PlatformAnalyticsDataSchema = z.object({
  totalTVL: z.number(),
  totalLotteryPool: z.number(),
  totalActiveInvestors: z.number(),
  fundStats: z.array(FundStatSchema),
  tvlGrowthData: z.array(GrowthDataPointSchema),
});
export type PlatformAnalyticsData = z.infer<typeof PlatformAnalyticsDataSchema>;

// Firestore Document Types
type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amountUSD: number;
  netAmountUSD: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
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
    const investmentsCollection = collection(db, "investments");
    
    const [investmentsSnapshot, settings] = await Promise.all([
      getDocs(query(investmentsCollection, where('status', '==', 'active'))),
      getPlatformSettings()
    ]);

    const activeInvestments = investmentsSnapshot.docs.map(doc => doc.data() as InvestmentDocument);

    let totalTVL = 0;
    let totalLotteryPool = 0;
    const allInvestors = new Set<string>();
    
    const fundData: Record<string, { totalValue: number; investors: Set<string> }> = {
        gold: { totalValue: 0, investors: new Set() },
        silver: { totalValue: 0, investors: new Set() },
        usdt: { totalValue: 0, investors: new Set() },
        bitcoin: { totalValue: 0, investors: new Set() },
    };

    const tvlByDate: Record<string, number> = {};

    activeInvestments.forEach(inv => {
        const netValue = inv.netAmountUSD;
        totalTVL += netValue;
        totalLotteryPool += inv.amountUSD * (settings.lotteryFee / 100);
        allInvestors.add(inv.userId);
        
        if (fundData[inv.fundId]) {
            fundData[inv.fundId].totalValue += netValue;
            fundData[inv.fundId].investors.add(inv.userId);
        }

        const dateKey = inv.createdAt.toDate().toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' });
        if (!tvlByDate[dateKey]) {
            tvlByDate[dateKey] = 0;
        }
        tvlByDate[dateKey] += netValue;
    });

    const fundStats = Object.entries(fundData).map(([id, data]) => ({
      id,
      name: fundNames[id] || id,
      totalValue: data.totalValue,
      investorCount: data.investors.size
    }));
    
    let cumulativeTvl = 0;
    const tvlGrowthData = Object.entries(tvlByDate)
        .sort((a,b) => a[0].localeCompare(b[0]))
        .map(([date, value]) => {
            cumulativeTvl += value;
            return { date, tvl: cumulativeTvl };
    });

    return {
      totalTVL,
      totalLotteryPool,
      totalActiveInvestors: allInvestors.size,
      fundStats,
      tvlGrowthData,
    };
  }
);
