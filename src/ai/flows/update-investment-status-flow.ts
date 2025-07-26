
'use server';
/**
 * @fileOverview A flow for updating an investment's status.
 *
 * - updateInvestmentStatus - Handles updating an investment document in Firestore.
 * - UpdateInvestmentStatusInput - The input type for the function.
 * - UpdateInvestmentStatusOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Input Schema
const UpdateInvestmentStatusInputSchema = z.object({
  investmentId: z.string().describe('The ID of the investment to update.'),
  newStatus: z.enum(['active', 'rejected']).describe('The new status for the investment.'),
});
export type UpdateInvestmentStatusInput = z.infer<typeof UpdateInvestmentStatusInputSchema>;

// Output Schema
const UpdateInvestmentStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateInvestmentStatusOutput = z.infer<typeof UpdateInvestmentStatusOutputSchema>;


export async function updateInvestmentStatus(input: UpdateInvestmentStatusInput): Promise<UpdateInvestmentStatusOutput> {
    return await updateInvestmentStatusFlow(input);
}


const updateInvestmentStatusFlow = ai.defineFlow(
  {
    name: 'updateInvestmentStatusFlow',
    inputSchema: UpdateInvestmentStatusInputSchema,
    outputSchema: UpdateInvestmentStatusOutputSchema,
  },
  async ({ investmentId, newStatus }) => {
    try {
      const investmentRef = doc(db, 'investments', investmentId);
      await updateDoc(investmentRef, {
        status: newStatus,
      });

      console.log(`Investment ${investmentId} status updated to ${newStatus}.`);

      const message = newStatus === 'active' 
        ? `سرمایه‌گذاری با شناسه ${investmentId} با موفقیت تایید و فعال شد.`
        : `سرمایه‌گذاری با شناسه ${investmentId} با موفقیت رد شد.`;

      return {
        success: true,
        message: message,
      };

    } catch (error) {
      console.error(`Error updating investment ${investmentId} status:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `خطایی در به‌روزرسانی وضعیت سرمایه‌گذاری رخ داد: ${errorMessage}`,
      };
    }
  }
);
