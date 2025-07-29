
'use server';
/**
 * @fileOverview A flow for handling new withdrawal requests.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, doc, query, where, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';
import { getUserDetails } from './get-user-details-flow';

const ai = genkit({
  plugins: [googleAI()],
});

const CreateWithdrawalRequestInputSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  walletAddress: z.string(),
  twoFactorCode: z.string(),
});

const CreateWithdrawalRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function createWithdrawalRequest(input: z.infer<typeof CreateWithdrawalRequestInputSchema>): Promise<z.infer<typeof CreateWithdrawalRequestOutputSchema>> {
  return await createWithdrawalRequestFlow(input);
}

const createWithdrawalRequestFlow = ai.defineFlow(
  {
    name: 'createWithdrawalRequestFlow',
    inputSchema: CreateWithdrawalRequestInputSchema,
    outputSchema: CreateWithdrawalRequestOutputSchema,
  },
  async ({ userId, amount, walletAddress, twoFactorCode }) => {
    
    if (twoFactorCode !== '123456') { // Placeholder for real 2FA validation
        return {
            success: false,
            message: "Invalid two-factor authentication code.",
        };
    }

    try {
        const settings = await getPlatformSettings();
        // Use the single source of truth to get the current, accurate balance
        const userDetails = await getUserDetails({ userId });
        const currentBalance = userDetails.stats.walletBalance;

        if (currentBalance < amount) {
            return {
                success: false,
                message: `Your wallet balance (${currentBalance.toLocaleString()}$) is not enough to withdraw ${amount.toLocaleString()}$.`,
            };
        }

        const pendingWithdrawalsQuery = query(
            collection(db, 'withdrawals'),
            where('userId', '==', userId),
            where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingWithdrawalsQuery);

        if (!pendingSnapshot.empty) {
            return {
                success: false,
                message: 'You already have a pending withdrawal request. Please wait until it is processed.',
            };
        }
         if (amount < settings.minWithdrawalAmount) {
            return {
                success: false,
                message: `Minimum withdrawal amount is $${settings.minWithdrawalAmount}.`,
            };
        }

        await runTransaction(db, async (transaction) => {
            const exitFee = amount * (settings.exitFee / 100);
            const networkFee = settings.networkFee || 0;
            const totalFees = exitFee + networkFee;
            const netAmount = amount - totalFees;

            if (netAmount <= 0) {
                throw new Error("The requested amount must be positive after fees.");
            }

            // Create the main withdrawal document
            const withdrawalRef = doc(collection(db, 'withdrawals'));
            const newWithdrawal = {
                userId,
                amount,
                walletAddress,
                status: 'pending', 
                createdAt: serverTimestamp(),
                exitFee: exitFee,
                networkFee: networkFee,
                netAmount: netAmount,
            };
            transaction.set(withdrawalRef, newWithdrawal);

            // Create a fee record for the exit fee to be distributed later
             const feesCollectionRef = collection(db, 'daily_fees');
             if (exitFee > 0) {
                transaction.set(doc(feesCollectionRef), {
                    type: 'exit_fee',
                    amount: exitFee,
                    createdAt: serverTimestamp(),
                    distributed: false,
                    withdrawalId: withdrawalRef.id,
                 });
             }

            // Create a transaction record to immediately debit the balance
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId,
                type: 'withdrawal_request',
                amount: -amount, // Debit the full amount from balance immediately
                status: 'pending',
                createdAt: serverTimestamp(),
                details: `Withdrawal request to ${walletAddress}`,
                withdrawalId: withdrawalRef.id
            });
        });

        return {
            success: true,
            message: "Your withdrawal request has been submitted successfully and will be processed after admin review (within 24 business hours).",
        };
    } catch (e) {
        console.error("Error creating withdrawal request: ", e);
        const errorMessage = e instanceof Error ? e.message : "An error occurred while saving your request to the database.";
        return {
            success: false,
            message: errorMessage,
        };
    }
  }
);
