
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
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        const withdrawalDoc = await transaction.get(withdrawalRef);
        if (!withdrawalDoc.exists()) {
          throw new Error(`درخواست برداشت با شناسه ${withdrawalId} یافت نشد.`);
        }
        const withdrawalData = withdrawalDoc.data();
        if (withdrawalData.status !== 'pending') {
            throw new Error('این درخواست قبلاً پردازش شده است.');
        }

        // Find the associated transaction record to update its status
        const txQuery = query(collection(db, 'transactions'), where('withdrawalId', '==', withdrawalId));
        const txSnapshot = await getDocs(txQuery); // This query does not need transaction
        const txDocRef = txSnapshot.docs.length > 0 ? txSnapshot.docs[0].ref : null;

        if (!txDocRef) {
            throw new Error(`تراکنش مرتبط با این برداشت یافت نشد. شناسه: ${withdrawalId}`);
        }

        const updatePayload: Record<string, any> = { status: newStatus === 'approved' ? 'completed' : 'rejected' };
        
        if (newStatus === 'approved') {
          if (!adminTransactionProof) {
            throw new Error('برای تایید برداشت، ارائه رسید تراکنش الزامی است.');
          }
          updatePayload.adminTransactionProof = adminTransactionProof;
          
          // Update withdrawal document status
          transaction.update(withdrawalRef, updatePayload);
          // Update the corresponding transaction status
          transaction.update(txDocRef, {
              status: 'completed',
              details: `برداشت موفق به ${withdrawalData.walletAddress}`,
              proof: adminTransactionProof
          });

        } else { // If 'rejected'
          // Update withdrawal document status
          transaction.update(withdrawalRef, { status: 'rejected' });
          // Update the corresponding transaction status
          transaction.update(txDocRef, { status: 'rejected', details: 'درخواست برداشت توسط مدیر رد شد.' });
        }
      });

      console.log(`Withdrawal ${withdrawalId} status updated to ${newStatus}.`);

      const message = newStatus === 'approved' 
        ? `درخواست برداشت با موفقیت تایید و رسید ثبت شد.`
        : `درخواست برداشت با موفقیت رد شد.`;

      return { success: true, message: message };

    } catch (error) {
      console.error(`Error updating withdrawal ${withdrawalId} status:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `خطایی در به‌روزرسانی وضعیت درخواست رخ داد: ${errorMessage}` };
    }
  }
);

    