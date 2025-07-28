
'use server';
/**
 * @fileOverview A flow for updating a withdrawal request's status, including deducting from balance.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, runTransaction, increment, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

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
        if (withdrawalData.status !== 'pending') {
            throw new Error('این درخواست قبلاً پردازش شده است.');
        }

        const userId = withdrawalData.userId;
        const userRef = doc(db, 'users', userId);

        // Find the associated transaction record to update its status
        const txQuery = query(collection(db, 'transactions'), where('withdrawalId', '==', withdrawalId), where('userId', '==', userId));
        const txSnapshot = await getDocs(txQuery);
        const txDocRef = txSnapshot.docs.length > 0 ? txSnapshot.docs[0].ref : null;

        const updatePayload: Record<string, any> = { status: newStatus };

        if (newStatus === 'approved') {
          if (!adminTransactionProof) {
            throw new Error('برای تایید برداشت، ارائه رسید تراکنش الزامی است.');
          }
          // The amount was already deducted from the user's wallet when the request was created.
          // Now we just update the status to 'completed' and log the admin proof.
          updatePayload.adminTransactionProof = adminTransactionProof;
          updatePayload.status = 'completed'; 
          transaction.update(withdrawalRef, updatePayload);

          if (txDocRef) {
              transaction.update(txDocRef, {
                  status: 'completed',
                  details: `برداشت موفق به ${withdrawalData.walletAddress}`,
                  proof: adminTransactionProof
              });
          }

        } else { // If 'rejected'
          // We need to return the deducted amount back to the user's wallet.
          transaction.update(userRef, {
              walletBalance: increment(withdrawalData.amount) // Return the gross amount
          });
          // And update the withdrawal and transaction status.
          transaction.update(withdrawalRef, { status: 'rejected' });
          if(txDocRef) {
              transaction.update(txDocRef, { status: 'rejected', details: 'درخواست برداشت توسط مدیر رد شد.' });
          }
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
