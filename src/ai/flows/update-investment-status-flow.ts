'use server';
/**
 * @fileOverview A flow for updating an investment's status.
 * This is a critical flow that triggers other financial events.
 */

import { genkit } from 'genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, serverTimestamp, runTransaction, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';
import { UpdateInvestmentStatusInputSchema, UpdateInvestmentStatusOutputSchema } from '@/ai/schemas';
import { googleAI } from '@genkit-ai/googleai';


const ai = genkit({
  plugins: [googleAI()],
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
      await runTransaction(db, async (transaction) => {
        const settings = await getPlatformSettings();
        const investmentRef = doc(db, 'investments', investmentId);
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
            const batch = writeBatch(db);
            // 1. Credit the net amount to the user's wallet (transactions ledger)
            const investmentTxRef = doc(collection(db, 'transactions'));
            batch.set(investmentTxRef, {
                userId: investmentData.userId,
                type: 'investment',
                amount: investmentData.netAmountUSD, // POSITIVE amount to credit the wallet
                status: 'completed',
                createdAt: serverTimestamp(),
                details: `Investment in ${investmentData.fundId} fund`,
                investmentId: investmentId,
                fundId: investmentData.fundId,
            });
            
            // 2. Add each fee to the daily_fees collection for later distribution
            const feesCollectionRef = collection(db, 'daily_fees');
            const entryFee = investmentData.amountUSD * (settings.entryFee / 100);
            const lotteryFee = investmentData.amountUSD * (settings.lotteryFee / 100);
            const platformFee = investmentData.amountUSD * (settings.platformFee / 100);

            if (entryFee > 0) {
                 batch.set(doc(feesCollectionRef), {
                    type: 'entry_fee',
                    amount: entryFee,
                    createdAt: serverTimestamp(),
                    distributed: false,
                    investmentId: investmentId,
                    fundId: investmentData.fundId,
                 });
            }
             if (lotteryFee > 0) {
                 batch.set(doc(feesCollectionRef), {
                    type: 'lottery_fee',
                    amount: lotteryFee,
                    createdAt: serverTimestamp(),
                    distributed: false, // Lottery fees are not distributed daily
                    investmentId: investmentId,
                    fundId: investmentData.fundId,
                 });
            }
             if (platformFee > 0) {
                 batch.set(doc(feesCollectionRef), {
                    type: 'platform_fee',
                    amount: platformFee,
                    createdAt: serverTimestamp(),
                    distributed: true, // Platform fees are not redistributed to users
                    investmentId: investmentId,
                    fundId: investmentData.fundId,
                 });
            }


            // 3. Check for and award the signup bonus if eligible (as a LOCKED bonus)
            const bonusesRef = collection(db, 'bonuses');
            const userBonusQuery = query(bonusesRef, where('userId', '==', investmentData.userId));
            const userBonusSnapshot = await getDocs(userBonusQuery);

            if (userBonusSnapshot.empty) {
                const totalBonusesQuery = query(bonusesRef);
                const totalBonusesSnapshot = await getDocs(totalBonusesQuery);
                if (totalBonusesSnapshot.size < REWARD_USER_LIMIT) {
                    const bonusDocRef = doc(collection(db, 'bonuses'));
                    batch.set(bonusDocRef, {
                        userId: investmentData.userId,
                        amount: REWARD_AMOUNT,
                        status: 'locked', 
                        awardedAt: serverTimestamp(),
                        reason: `First ${REWARD_USER_LIMIT} users bonus`
                    });
                }
            }


          // 4. Handle referral commission
          if (userDoc.exists() && userDoc.data()?.referredBy) {
            const referrerId = userDoc.data()!.referredBy;
            const commissionAmount = investmentData.amountUSD * (settings.entryFee * 2/3 / 100); 

            if (commissionAmount > 0) {
              const commissionDocRef = doc(collection(db, 'commissions'));
              batch.set(commissionDocRef, {
                referrerId: referrerId,
                referredUserId: investmentData.userId,
                investmentId: investmentId,
                investmentAmount: investmentData.amountUSD,
                commissionAmount: commissionAmount,
                createdAt: serverTimestamp(),
              });
              
              const txRef = doc(collection(db, 'transactions'));
              batch.set(txRef, {
                  userId: referrerId,
                  type: 'commission',
                  amount: commissionAmount,
                  status: 'completed',
                  createdAt: serverTimestamp(),
                  details: `Commission from user ${investmentData.userId.substring(0, 6)}`,
              });
            }
          }
          await batch.commit();

        } else if (newStatus === 'completed') {
            // New logic: Return principal to user's wallet
            const txRef = doc(collection(db, 'transactions'));
            transaction.set(txRef, {
                userId: investmentData.userId,
                type: 'principal_return',
                amount: investmentData.netAmountUSD, // Return the net amount
                status: 'completed',
                createdAt: serverTimestamp(),
                details: `Principal return from ${investmentData.fundId} fund`,
                investmentId: investmentId,
                fundId: investmentData.fundId,
            });
        }
      });

      console.log(`Investment ${investmentId} status updated to ${newStatus}.`);

      let message = '';
      if (newStatus === 'active') {
        message = `Investment ${investmentId} has been successfully approved and added to the user's balance.`;
      } else if (newStatus === 'rejected') {
        message = `Investment ${investmentId} has been successfully rejected.`;
      } else if (newStatus === 'completed') {
        message = `Investment has been completed and the principal returned to the user's wallet.`;
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
        message: `An error occurred while updating investment status: ${errorMessage}`,
      };
    }
  }
);
