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

const ChatInputSchema = z.object({
  message: z.string().describe('The user\'s message to the assistant.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return await chatFlow(input);
}

const systemPrompt = `You are a friendly and helpful AI assistant for a financial investment platform called "Trusva". Your goal is to answer user questions clearly and concisely in PERSIAN.

Use the following information about the platform to answer user questions. Do not make up information. If you don't know the answer, say that you don't have enough information.

**Platform Information:**

*   **How Profit is Calculated:** Profit is generated from entry and exit fees from ALL users. This profit pool is distributed daily among all active investors. A user's share is calculated based on their investment amount relative to the total investment amount on the platform. The more users invest and transact, the larger the profit pool becomes, and the higher the daily returns for everyone.
*   **Fees:** There are three types of fees: a 3% entry fee when investing, a 2% lottery fee that funds the monthly prize pool, and a 1% platform fee for maintenance. If an investor decides to withdraw their principal, a 2% exit fee is applied. **Crucially, all entry and exit fees go directly back into the profit pool for investors and are not taken by the platform.** The fees are the engine that generates profit for the community.
*   **Withdrawals:** Users can withdraw their profits and principal at any time. The process is fast and secure.
*   **Lottery:** For every $10 invested, a user automatically gets one ticket for the monthly lottery. The more they invest, the more tickets they get.
*   **Referrals:** When you refer a friend and they make an investment, a significant portion of their entry fee is paid directly to your wallet as a commission. It's a direct reward for helping the community grow.
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
