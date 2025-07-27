
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
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

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
  async () => {
    console.log('Running lottery draw...');

    try {
        const { users } = await getAllUsers({});

        if (users.length === 0) {
            return {
                success: false,
                winnerName: '',
                prizeAmount: 0,
                message: 'هیچ کاربری برای شرکت در قرعه‌کشی یافت نشد.',
            }
        }
        
        // Calculate the total prize pool from all investments
        const investmentsSnapshot = await getDocs(collection(db, "investments"));
        const prizePool = investmentsSnapshot.docs.reduce((sum, doc) => {
            const amount = doc.data().amount || 0;
            return sum + (amount * 0.02); // 2% lottery fee
        }, 0);


        const eligibleUsers = users.filter(u => u.totalInvestment > 0);
        if (eligibleUsers.length === 0) {
             return {
                success: false,
                winnerName: '',
                prizeAmount: 0,
                message: 'هیچ کاربر واجد شرایطی (با سرمایه‌گذاری فعال) یافت نشد.',
            }
        }
        
        const winner = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
        const winnerName = `${winner.firstName} ${winner.lastName}`;
        
        // Save winner to the database
        await addDoc(collection(db, 'lottery_winners'), {
            userId: winner.uid,
            userName: winnerName,
            prizeAmount: prizePool,
            drawDate: serverTimestamp(),
        });

        return {
            success: true,
            winnerName: winnerName,
            prizeAmount: prizePool,
            message: `قرعه‌کشی با موفقیت انجام شد! برنده این دوره ${winnerName} با جایزه $${prizePool.toLocaleString()} است.`,
        };

    } catch (error) {
         console.error("Error running lottery draw: ", error);
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
         return {
            success: false,
            winnerName: '',
            prizeAmount: 0,
            message: `خطایی در هنگام اجرای قرعه‌کشی رخ داد: ${errorMessage}`,
        };
    }
  }
);
