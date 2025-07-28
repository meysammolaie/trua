
'use server';
/**
 * @fileOverview A flow for updating an investment's status.
 *
 * - updateInvestmentStatus - Handles updating an investment document in Firestore.
 * - UpdateInvestmentStatusInput - The input type for the function.
 * - UpdateInvestmentStatusOutput - The return type for the function.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';
import { UpdateInvestmentStatusInputSchema, UpdateInvestmentStatusOutputSchema } from '@/ai/schemas';

const ai = genkit({
  plugins: [],
});

export type UpdateInvestmentStatusInput = z.infer<typeof UpdateInvestmentStatusInputSchema>;
export type UpdateInvestmentStatusOutput = z.infer<typeof UpdateInvestmentStatusOutputSchema>;

const REWARD_USER_LIMIT = 5000;
const REWARD_AMOUNT = 100;

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
        const settings = await getPlatformSettings();
        const investmentDoc = await transaction.get(investmentRef);
        
        if (!investmentDoc.exists()) {
          throw new Error(`Investment with ID ${investmentId} not found.`);
        }
        
        const investmentData = investmentDoc.data();
        if (investmentData.status === newStatus) {
            return; // No change needed
        }

        const userRef = doc(db, 'users', investmentData.userId);
        const userDoc = await transaction.get(userRef);

        const updatePayload: { status: string, rejectionReason?: string, updatedAt?: any } = { 
            status: newStatus,
            updatedAt: serverTimestamp(),
        };
        if (newStatus === 'rejected' && rejectionReason) {
          updatePayload.rejectionReason = rejectionReason;
        }
        transaction.update(investmentRef, updatePayload);
        
        if (newStatus === 'active') {

            // Add investment fees to the daily_fees collection for profit distribution
            if (investmentData.feesUSD && investmentData.feesUSD > 0) {
                const feeLedgerRef = doc(collection(db, 'daily_fees'));
                transaction.set(feeLedgerRef, {
                    amount: investmentData.feesUSD,
                    distributed: false,
                    createdAt: serverTimestamp(),
                    investmentId: investmentId,
                });
            }

            const bonusesRef = collection(db, 'bonuses');
            const userBonusQuery = query(bonusesRef, where('userId', '==', investmentData.userId));
            const userBonusSnapshot = await getDocs(userBonusQuery);

            if (userBonusSnapshot.empty) {
                const totalBonusesQuery = query(bonusesRef);
                const totalBonusesSnapshot = await getDocs(totalBonusesQuery);
                if (totalBonusesSnapshot.size < REWARD_USER_LIMIT) {
                    const bonusDocRef = doc(collection(db, 'bonuses'));
                    transaction.set(bonusDocRef, {
                        userId: investmentData.userId,
                        amount: REWARD_AMOUNT,
                        status: 'locked',
                        awardedAt: serverTimestamp(),
                        reason: `First ${REWARD_USER_LIMIT} users bonus`
                    });

                    // Create a transaction to credit the user's WALLET for the bonus
                    const txRef = doc(collection(db, 'transactions'));
                     transaction.set(txRef, {
                        userId: investmentData.userId,
                        type: 'bonus',
                        amount: REWARD_AMOUNT,
                        status: 'completed',
                        createdAt: serverTimestamp(),
                        details: `جایزه برای ${REWARD_USER_LIMIT} کاربر اول`,
                    });
                }
            }


          if (userDoc.exists() && userDoc.data()?.referredBy) {
            const referrerId = userDoc.data()!.referredBy;
            const commissionAmount = investmentData.amountUSD * (settings.entryFee * 2/3 / 100); 

            if (commissionAmount > 0) {
              const commissionDocRef = doc(collection(db, 'commissions'));
              transaction.set(commissionDocRef, {
                referrerId: referrerId,
                referredUserId: investmentData.userId,
                investmentId: investmentId,
                investmentAmount: investmentData.amountUSD,
                commissionAmount: commissionAmount,
                createdAt: serverTimestamp(),
              });
              
              const txRef = doc(collection(db, 'transactions'));
              transaction.set(txRef, {
                  userId: referrerId,
                  type: 'commission',
                  amount: commissionAmount,
                  status: 'completed',
                  createdAt: serverTimestamp(),
                  details: `Commission from user ${investmentData.userId.substring(0, 6)}`,
              });
            }
          }
        } else if (newStatus === 'completed') {
            const amountToReturn = investmentData.netAmountUSD || 0;
            if (amountToReturn > 0) {
                const txRef = doc(collection(db, 'transactions'));
                transaction.set(txRef, {
                    userId: investmentData.userId,
                    type: 'principal_return',
                    amount: amountToReturn,
                    status: 'completed',
                    createdAt: serverTimestamp(),
                    details: `Return of principal from investment ${investmentId.substring(0,6)}`,
                });
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
        message = `سرمایه‌گذاری تکمیل شد و اصل پول به کیف پول کاربر بازگردانده شد.`;
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
