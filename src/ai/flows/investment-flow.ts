
'use server';
/**
 * @fileOverview A flow for handling new investment requests.
 *
 * - submitInvestment - Handles the submission of a new investment.
 * - InvestmentInput - The input type for the submitInvestment function.
 * - InvestmentOutput - The return type for the submitInvestment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentInputSchema = z.object({
  fundId: z.string().describe('The ID of the fund being invested in (e.g., "gold", "bitcoin").'),
  amount: z.number().describe('The amount of the investment in USD.'),
  transactionHash: z.string().describe('The transaction hash (TxID) of the deposit.'),
});
export type InvestmentInput = z.infer<typeof InvestmentInputSchema>;

const InvestmentOutputSchema = z.object({
  success: z.boolean().describe('Whether the investment submission was accepted.'),
  investmentId: z.string().describe('A unique ID for the new investment.'),
  message: z.string().describe('A confirmation or error message.'),
});
export type InvestmentOutput = z.infer<typeof InvestmentOutputSchema>;


export async function submitInvestment(input: InvestmentInput): Promise<InvestmentOutput> {
  return await investmentFlow(input);
}


const investmentFlow = ai.defineFlow(
  {
    name: 'investmentFlow',
    inputSchema: InvestmentInputSchema,
    outputSchema: InvestmentOutputSchema,
  },
  async (input) => {
    console.log('Received investment submission:', input);
    
    // In a real application, you would:
    // 1. Validate the transactionHash with a blockchain service.
    // 2. Save the investment details to a database.
    // 3. Return the real ID from the database.

    const fakeInvestmentId = `INV-${Date.now()}`;

    return {
      success: true,
      investmentId: fakeInvestmentId,
      message: `سرمایه‌گذاری شما در صندوق ${input.fundId} با شناسه ${fakeInvestmentId} ثبت و در حال پردازش است.`,
    };
  }
);
