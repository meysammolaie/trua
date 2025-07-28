
'use server';
/**
 * @fileOverview A flow for updating an investment's status.
 *
 * - updateInvestmentStatus - Handles updating an investment document in Firestore.
 * - UpdateInvestmentStatusInput - The input type for the function.
 * - UpdateInvestmentStatusOutput - The return type for the function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';
import { UpdateInvestmentStatusInputSchema, UpdateInvestmentStatusOutputSchema } from '@/ai/schemas';

const ai = genkit({
  plugins: [googleAI()],
});


export type UpdateInvestmentStatusInput = z.infer<typeof UpdateInvestmentStatusInputSchema>;
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
  async ({ investmentId, newStatus, rejectionReason }) => {
    try {
      const investmentRef = doc(db, 'investments', investmentId);
      
      await runTransaction(db, async (transaction) => {
        // ========== ALL READS FIRST ==========
        const settings = await getPlatformSettings();
        const investmentDoc = await transaction.get(investmentRef);
        
        if (!investmentDoc.exists()) {
          throw new Error(`Investment with ID ${investmentId} not found.`);
        }
        
        const investmentData = investmentDoc.data();
        if (investmentData.status === newStatus) {
            // No change needed
            return;
        }

        const userRef = doc(db, 'users', investmentData.userId);
        const userDoc = await transaction.get(userRef);

        // ========== ALL WRITES LAST ==========
        
        // 1. Always update the investment status
        const updatePayload: { status: string, rejectionReason?: string } = { status: newStatus };
        if (newStatus === 'rejected' && rejectionReason) {
          updatePayload.rejectionReason = rejectionReason;
        }
        transaction.update(investmentRef, updatePayload);
        
        // Handle different statuses
        if (newStatus === 'active') {
          // If activating, handle referral commission if the user was referred
          if (userDoc.exists() && userDoc.data().referredBy) {
            const referrerId = userDoc.data().referredBy;
            const commissionAmount = investmentData.amountUSD * (settings.entryFee * 2/3 / 100); // 2/3 of entry fee on USD amount

            if (commissionAmount > 0) {
              const commissionDocRef = doc(collection(db, 'commissions'));
              const commissionData = {
                referrerId: referrerId,
                referredUserId: investmentData.userId,
                investmentId: investmentId,
                investmentAmount: investmentData.amountUSD,
                commissionAmount: commissionAmount,
                createdAt: serverTimestamp(),
              };
              transaction.set(commissionDocRef, commissionData);
              
              const referrerUserRef = doc(db, 'users', referrerId);
              const txRef = doc(collection(db, 'transactions'));
              const txData = {
                  userId: referrerId,
                  type: 'commission',
                  amount: commissionAmount,
                  status: 'completed',
                  createdAt: serverTimestamp(),
                  details: `Commission from user ${investmentData.userId.substring(0, 6)}`,
              };
              transaction.set(txRef, txData);
            }
          }
        } else if (newStatus === 'completed') {
            // If completing, return principal (net amount) to user's wallet
            const amountToReturn = investmentData.netAmountUSD || 0;
            if (amountToReturn > 0) {
                const txRef = doc(collection(db, 'transactions'));
                const txData = {
                    userId: investmentData.userId,
                    type: 'principal_return',
                    amount: amountToReturn,
                    status: 'completed',
                    createdAt: serverTimestamp(),
                    details: `Return of principal from investment ${investmentId.substring(0,6)}`,
                };
                transaction.set(txRef, txData);
            }
        }
      });

      console.log(`Investment ${investmentId} status updated to ${newStatus}.`);

      let message = '';
      if (newStatus === 'active') {
        message = `سرمایه‌گذاری با شناسه ${investmentId} با موفقیت تایید و فعال شد.`;
      } else if (newStatus === 'rejected') {
        message = `سرمایه‌گذاری با شناسه ${investmentId} با موفقیت رد شد.`;
      } else if (newStatus === 'completed') {
        message = `سرمایه‌گذاری با شناسه ${investmentId} تکمیل شد و اصل پول به کیف پول کاربر بازگردانده شد.`;
      }

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

    