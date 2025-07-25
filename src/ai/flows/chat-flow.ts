'use server';
/**
 * @fileOverview A simple chat flow for user support.
 *
 * - chat - A function that handles the chat interaction.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const ChatInputSchema = z.object({
  message: z.string().describe('The user\'s message to the assistant.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return await chatFlow(input);
}

const systemPrompt = `You are a friendly and helpful AI assistant for a financial investment platform called "Verdant Vault" (خزانه سرسبز). Your goal is to answer user questions clearly and concisely in PERSIAN.

Use the following information about the platform to answer user questions. Do not make up information. If you don't know the answer, say that you don't have enough information.

**Platform Information:**

*   **How Profit is Calculated:** Profit is generated from entry and exit fees. This pool is distributed daily among all active investors. A user's share is calculated based on their investment amount, the duration of the investment, and a special incentive coefficient that rewards long-term investors.
*   **Fees:** There are three types of fees: a 3% entry fee when investing, a 2% lottery fee that funds the monthly prize pool, and a 1% platform fee for maintenance. If an investor decides to withdraw their principal, a 2% exit fee is applied, which goes back into the profit pool for other investors.
*   **Lottery:** For every $10 invested, a user automatically gets one ticket for the monthly lottery. The more they invest, the more tickets they get.
*   **Security:** The platform uses state-of-the-art security measures, including two-factor authentication (2FA), encrypted data storage, and regular security audits.
*   **Investment Funds:** Users can diversify their portfolio by investing in any or all of the four funds: Gold, Silver, Dollar, and Bitcoin.
`;

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
      prompt: input.message,
      system: systemPrompt,
    });

    return {
      response: llmResponse.text,
    };
  }
);
