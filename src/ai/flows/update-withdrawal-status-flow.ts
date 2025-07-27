'use server';
/**
 * @fileOverview A flow for updating a withdrawal request's status, including deducting from balance.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction, increment } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

// Input Schema
const UpdateWithdrawalStatusInputSchema = z.object({
  withdrawalId: z.string().describe('The ID of the withdrawal request to update.'),
  newStatus: z.enum(['approved', 'rejected']).describe('The new status for the request.'),
});
export type UpdateWithdrawalStatusInput = z.infer<typeof UpdateWithdrawalStatusInputSchema>;

// Output Schema
const UpdateWithdrawalStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateWithdrawalStatusOutput = z.infer<typeof UpdateWithdrawalStatusOutputSchema>;

export async function updateWithdrawalStatus(input: z.infer<typeof UpdateWithdrawalStatusInputSchema>): Promise<z.infer<typeof UpdateWithdrawalStatusOutputSchema>> {
    return await updateWithdrawalStatusFlow(input);
}

const updateWithdrawalStatusFlow = ai.defineFlow(
  {
    name: 'updateWithdrawalStatusFlow',
    inputSchema: UpdateWithdrawalStatusInputSchema,
    outputSchema: UpdateWithdrawalStatusOutputSchema,
  },
  async ({ withdrawalId, newStatus }) => {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);

      await runTransaction(db, async (transaction) => {
        const withdrawalDoc = await transaction.get(withdrawalRef);
        if (!withdrawalDoc.exists()) {
          throw new Error(`درخواست برداشت با شناسه ${withdrawalId} یافت نشد.`);
        }

        const withdrawalData = withdrawalDoc.data();
        const userId = withdrawalData.userId;
        const amountToDeduct = withdrawalData.amount; // The gross amount requested by user

        // If approving, we must check balance and deduct from the user's wallet.
        if (newStatus === 'approved') {
          const userRef = doc(db, 'users', userId);
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error(`کاربر با شناسه ${userId} یافت نشد.`);
          }
          
          const currentUserBalance = userDoc.data().walletBalance || 0;
          if (currentUserBalance < amountToDeduct) {
            throw new Error(`موجودی کیف پول کاربر (${currentUserBalance.toLocaleString()}$) برای برداشت مبلغ (${amountToDeduct.toLocaleString()}$) کافی نیست.`);
          }

          // 1. Deduct the amount from the user's walletBalance
          transaction.update(userRef, {
            walletBalance: increment(-amountToDeduct)
          });

          // 2. Update the withdrawal status to 'approved'
          transaction.update(withdrawalRef, { status: newStatus });
          
        } else { // If 'rejected'
          // Just update the status, no balance change.
          transaction.update(withdrawalRef, { status: newStatus });
        }
      });

      console.log(`Withdrawal ${withdrawalId} status updated to ${newStatus}.`);

      const message = newStatus === 'approved' 
        ? `درخواست برداشت با موفقیت تایید و مبلغ از کیف پول کاربر کسر شد.`
        : `درخواست برداشت با موفقیت رد شد.`;

      return { success: true, message: message };

    } catch (error) {
      console.error(`Error updating withdrawal ${withdrawalId} status:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `خطایی در به‌روزرسانی وضعیت درخواست رخ داد: ${errorMessage}` };
    }
  }
);
