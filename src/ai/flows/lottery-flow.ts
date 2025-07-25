
'use server';
/**
 * @fileOverview A flow for running the lottery draw.
 *
 * - runLotteryDraw - Handles the manual lottery draw process.
 * - LotteryDrawInput - The input type for the runLotteryDraw function.
 * - LotteryDrawOutput - The return type for the runLotteryDraw function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getAllUsers } from './get-all-users-flow';

const LotteryDrawInputSchema = z.object({});
export type LotteryDrawInput = z.infer<typeof LotteryDrawInputSchema>;

const LotteryDrawOutputSchema = z.object({
  success: z.boolean().describe('Whether the draw was successful.'),
  winnerName: z.string().describe('The name of the lottery winner.'),
  prizeAmount: z.number().describe('The amount of the prize won.'),
  message: z.string().describe('A confirmation or error message.'),
});
export type LotteryDrawOutput = z.infer<typeof LotteryDrawOutputSchema>;


export async function runLotteryDraw(input: LotteryDrawInput): Promise<LotteryDrawOutput> {
  return await lotteryDrawFlow(input);
}

const lotteryDrawFlow = ai.defineFlow(
  {
    name: 'lotteryDrawFlow',
    inputSchema: LotteryDrawInputSchema,
    outputSchema: LotteryDrawOutputSchema,
  },
  async (input) => {
    console.log('Running lottery draw...');

    // In a real application, you would:
    // 1. Get the list of all eligible tickets from the database.
    // 2. Randomly select a winner.
    // 3. Get the user associated with the winning ticket.
    // 4. Get the prize pool amount.
    // 5. Record the win in the database and create the payout transaction.

    // For now, we get all users and pick a random one.
    try {
        const { users } = await getAllUsers();

        if (users.length === 0) {
            return {
                success: false,
                winnerName: '',
                prizeAmount: 0,
                message: 'هیچ کاربری برای شرکت در قرعه‌کشی یافت نشد.',
            }
        }

        const winner = users[Math.floor(Math.random() * users.length)];
        const winnerName = `${winner.firstName} ${winner.lastName}`;
        const prize = Math.floor(Math.random() * (10000 - 4000 + 1) + 4000);
        
        return {
        success: true,
        winnerName: winnerName,
        prizeAmount: prize,
        message: `قرعه‌کشی با موفقیت انجام شد! برنده این دوره ${winnerName} با جایزه $${prize.toLocaleString()} است.`,
        };

    } catch (error) {
         console.error("Error running lottery draw: ", error);
         return {
            success: false,
            winnerName: '',
            prizeAmount: 0,
            message: 'خطایی در هنگام واکشی کاربران برای قرعه‌کشی رخ داد.',
        };
    }
  }
);
