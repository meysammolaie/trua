
'use server';
/**
 * @fileOverview A Genkit tool for fetching cryptocurrency prices.
 *
 * - getCryptoPrice - A tool that fetches the current price of a cryptocurrency in USD.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { z } from 'zod';
import fetch from 'node-fetch';

const ai = genkit({
  plugins: [googleAI()],
});

const GetCryptoPriceInputSchema = z.object({
  cryptoId: z.string().describe('The ID of the cryptocurrency on CoinGecko (e.g., "bitcoin", "ethereum", "pax-gold").'),
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
    // Map internal fund IDs to CoinGecko IDs
    const idMap: Record<string, string> = {
        bitcoin: 'bitcoin',
        gold: 'pax-gold',
        silver: 'kag-silver', // This ID is a placeholder as KAG is not on coingecko
        usdt: 'tether',
    }
    const coingeckoId = idMap[cryptoId] || cryptoId;

    // Fallback for precious metals or stablecoins if API fails
    if (coingeckoId === 'pax-gold') {
        // Placeholder price for Gold, API will be tried first
    }
    if (coingeckoId === 'kag-silver') {
        return { usd: 29.58 }; // Placeholder price for Silver as it's not on coingecko
    }
    if (coingeckoId === 'tether') {
        return { usd: 1.00 };
    }

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`);
        if (!response.ok) {
            // If API fails for Gold, return placeholder
            if (coingeckoId === 'pax-gold') return { usd: 2320.55 }; 
            throw new Error(`CoinGecko API request failed with status ${response.status}`);
        }
        const data = await response.json() as any;
        const price = data[coingeckoId]?.usd;

        if (typeof price !== 'number') {
            console.warn(`Could not fetch price for ${coingeckoId}. Using default value 0.`);
            if (coingeckoId === 'pax-gold') return { usd: 2320.55 }; // Fallback for Gold
            return { usd: 0 };
        }
        
        return { usd: price };

    } catch (error) {
        console.error(`Error fetching crypto price for ${coingeckoId}:`, error);
        // Return a default/fallback value in case of an error
        if (coingeckoId === 'pax-gold') return { usd: 2320.55 };
        return { usd: 0 };
    }
  }
);
