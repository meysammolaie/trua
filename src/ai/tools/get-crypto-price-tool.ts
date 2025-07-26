
'use server';
/**
 * @fileOverview A Genkit tool for fetching cryptocurrency prices.
 *
 * - getCryptoPrice - A tool that fetches the current price of a cryptocurrency in USD.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fetch from 'node-fetch';

const GetCryptoPriceInputSchema = z.object({
  cryptoId: z.string().describe('The ID of the cryptocurrency on CoinGecko (e.g., "bitcoin", "ethereum").'),
});

const GetCryptoPriceOutputSchema = z.object({
  usd: z.number().describe('The price of the cryptocurrency in USD.'),
});


export const getCryptoPrice = ai.defineTool(
  {
    name: 'getCryptoPrice',
    description: 'Fetches the current price of a given cryptocurrency in USD from CoinGecko.',
    inputSchema: GetCryptoPriceInputSchema,
    outputSchema: GetCryptoPriceOutputSchema,
  },
  async ({ cryptoId }) => {
    // Fallback for precious metals or stablecoins
    if (cryptoId === 'pax-gold') {
        return { usd: 2320.55 }; // Placeholder price for Gold
    }
    if (cryptoId === 'kag-silver') {
        return { usd: 29.58 }; // Placeholder price for Silver
    }
    if (cryptoId === 'tether') {
        return { usd: 1.00 };
    }

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        if (!response.ok) {
            throw new Error(`CoinGecko API request failed with status ${response.status}`);
        }
        const data = await response.json() as any;
        const price = data[cryptoId]?.usd;

        if (typeof price !== 'number') {
            console.warn(`Could not fetch price for ${cryptoId}. Using default value 0.`);
            return { usd: 0 };
        }
        
        return { usd: price };

    } catch (error) {
        console.error(`Error fetching crypto price for ${cryptoId}:`, error);
        // Return a default/fallback value in case of an error
        return { usd: 0 };
    }
  }
);
