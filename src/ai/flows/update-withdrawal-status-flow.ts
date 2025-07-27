
'use server';
/**
 * @fileOverview A flow for updating a withdrawal request's status, including deducting from balance.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

// Input Schema
const UpdateWithdrawalStatusInputSchema = z.object({
  withdrawalId: z.string().describe('The ID of the withdrawal request to update.'),
  newStatus: z.enum(['approved', 'rejected']).describe('The new status for the request.'),
  adminTransactionProof: z.string().optional().describe('The transaction hash or proof provided by the admin.'),
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
  async ({ withdrawalId, newStatus, adminTransactionProof }) => {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);

      await runTransaction(db, async (transaction) => {
        const withdrawalDoc = await transaction.get(withdrawalRef);
        if (!withdrawalDoc.exists()) {
          throw new Error(`درخواست برداشت با شناسه ${withdrawalId} یافت نشد.`);
        }
        const withdrawalData = withdrawalDoc.data();
        const userId = withdrawalData.userId;
        const userRef = doc(db, 'users', userId);

        const updatePayload: Record<string, any> = { status: newStatus };

        if (newStatus === 'approved') {
          if (!adminTransactionProof) {
            throw new Error('برای تایید برداشت، ارائه رسید تراکنش الزامی است.');
          }
          // The amount has already been deducted from the walletBalance when the request was created.
          // Now we just log the completed transaction.
          const transactionRef = doc(collection(db, 'transactions'));
          transaction.set(transactionRef, {
            userId,
            type: 'withdrawal',
            amount: -withdrawalData.netAmount,
            status: 'completed',
            createdAt: serverTimestamp(),
            details: `Withdrawal to ${withdrawalData.walletAddress}. Admin proof: ${adminTransactionProof}`,
            proof: adminTransactionProof
          });
          
          updatePayload.adminTransactionProof = adminTransactionProof;
          updatePayload.status = 'completed'; // Move directly to completed status
          transaction.update(withdrawalRef, updatePayload);

        } else { // If 'rejected'
          // We need to return the deducted amount back to the user's wallet.
          transaction.update(userRef, {
              walletBalance: increment(withdrawalData.amount) // Return the gross amount
          });
          // And update the status.
          transaction.update(withdrawalRef, updatePayload);
        }
      });

      console.log(`Withdrawal ${withdrawalId} status updated to ${newStatus}.`);

      const message = newStatus === 'approved' 
        ? `درخواست برداشت با موفقیت تایید و رسید ثبت شد.`
        : `درخواست برداشت با موفقیت رد و مبلغ به کیف پول کاربر بازگردانده شد.`;

      return { success: true, message: message };

    } catch (error) {
      console.error(`Error updating withdrawal ${withdrawalId} status:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `خطایی در به‌روزرسانی وضعیت درخواست رخ داد: ${errorMessage}` };
    }
  }
);
