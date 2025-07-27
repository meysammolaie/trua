
'use server';
/**
 * @fileOverview A flow for updating an investment's status.
 *
 * - updateInvestmentStatus - Handles updating an investment document in Firestore.
 * - UpdateInvestmentStatusInput - The input type for the function.
 * - UpdateInvestmentStatusOutput - The return type for the function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

// Input Schema
const UpdateInvestmentStatusInputSchema = z.object({
  investmentId: z.string().describe('The ID of the investment to update.'),
  newStatus: z.enum(['active', 'rejected', 'completed']).describe('The new status for the investment.'),
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
      
      await runTransaction(db, async (transaction) => {
        const investmentDoc = await transaction.get(investmentRef);
        if (!investmentDoc.exists()) {
          throw new Error(`Investment with ID ${investmentId} not found.`);
        }
        
        const investmentData = investmentDoc.data();
        const userRef = doc(db, 'users', investmentData.userId);

        // Update investment status
        transaction.update(investmentRef, { status: newStatus });
        
        // Handle different statuses
        if (newStatus === 'active') {
          // If activating, handle referral commission
          const userDoc = await transaction.get(userRef);

          if (userDoc.exists() && userDoc.data().referredBy) {
            const referrerId = userDoc.data().referredBy;
            const settings = await getPlatformSettings();
            
            const commissionAmount = investmentData.amount * (settings.entryFee * 2/3 / 100); // 2/3 of entry fee

            if (commissionAmount > 0) {
              const commissionData = {
                referrerId: referrerId,
                referredUserId: investmentData.userId,
                investmentId: investmentId,
                investmentAmount: investmentData.amount,
                commissionAmount: commissionAmount,
                createdAt: serverTimestamp(),
              };
              
              // 1. Create the commission document
              const commissionRef = doc(collection(db, 'commissions'));
              transaction.set(commissionRef, commissionData);

              // 2. Add commission amount to referrer's wallet balance
              const referrerUserRef = doc(db, 'users', referrerId);
              transaction.update(referrerUserRef, {
                  walletBalance: increment(commissionAmount)
              });
            }
          }
        } else if (newStatus === 'completed') {
            // If completing, return principal to user's wallet after exit fee
            const settings = await getPlatformSettings();
            const exitFee = investmentData.amount * (settings.exitFee / 100);
            const amountToReturn = investmentData.amount - exitFee;

            if (amountToReturn > 0) {
                 transaction.update(userRef, {
                    walletBalance: increment(amountToReturn)
                });
            }
            // Note: The exitFee should ideally be added to the profit pool for distribution.
            // This logic can be added later.
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
