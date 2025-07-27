
'use server';
/**
 * @fileOverview A flow for fetching all details for the investment funds.
 *
 * - getFundDetails - Fetches platform settings and live prices for funds.
 * - FundDetails - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getPlatformSettings } from './platform-settings-flow';
import type { PlatformSettings } from './platform-settings-flow';
import { PlatformSettingsSchema } from '@/ai/schemas';
import { getCryptoPrice } from '../tools/get-crypto-price-tool';


const PriceSchema = z.object({
    usd: z.number(),
});

const FundSchema = z.object({
    id: z.string(),
    name: z.string(),
    unit: z.string(),
    walletAddress: z.string(),
    price: PriceSchema,
});

const FundDetailsSchema = z.object({
  settings: PlatformSettingsSchema,
  funds: z.array(FundSchema),
});
export type FundDetails = z.infer<typeof FundDetailsSchema>;

export async function getFundDetails(): Promise<FundDetails> {
  return await getFundDetailsFlow({});
}

const getFundDetailsFlow = ai.defineFlow(
  {
    name: 'getFundDetailsFlow',
    inputSchema: z.object({}),
    outputSchema: FundDetailsSchema,
  },
  async () => {
    // 1. Fetch platform settings (fees, wallet addresses)
    const settings = await getPlatformSettings();

    // 2. Fetch crypto prices in parallel
    const [bitcoinPrice, goldPrice, silverPrice] = await Promise.all([
        getCryptoPrice({ cryptoId: 'bitcoin' }),
        getCryptoPrice({ cryptoId: 'pax-gold' }), // PAXG
        getCryptoPrice({ cryptoId: 'kag-silver' }), // KAG is not on coingecko, this will fallback
    ]);

    // 3. Assemble fund details
    const funds: z.infer<typeof FundSchema>[] = [
        { 
            id: 'usdt', 
            name: 'صندوق تتر', 
            unit: 'USDT', 
            walletAddress: settings.usdtWalletAddress,
            price: { usd: 1.00 } // Always $1
        },
        { 
            id: 'bitcoin', 
            name: 'صندوق بیت‌کوین', 
            unit: 'BTC', 
            walletAddress: settings.bitcoinWalletAddress,
            price: bitcoinPrice
        },
        { 
            id: 'gold', 
            name: 'صندوق طلا', 
            unit: 'PAXG', 
            walletAddress: settings.goldWalletAddress,
            price: goldPrice
        },
        { 
            id: 'silver', 
            name: 'صندوق نقره', 
            unit: 'KAG', 
            walletAddress: settings.silverWalletAddress,
            price: silverPrice
        },
    ];

    return {
      settings,
      funds,
    };
  }
);
