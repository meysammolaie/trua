
'use server';
/**
 * @fileOverview A flow for handling new withdrawal requests.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where, getDocs, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
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
    
    // 1. Validate 2FA code (placeholder logic)
    if (twoFactorCode !== '123456') { // Placeholder for real 2FA validation
        return {
            success: false,
            message: "کد تایید دو مرحله‌ای نامعتبر است.",
        };
    }

    try {
        const userRef = doc(db, 'users', userId);
        const settings = await getPlatformSettings();
        
        // Use the single source of truth to get the current, accurately calculated balance.
        const userDetails = await getUserDetails({ userId });
        const currentBalance = userDetails.stats.walletBalance;

        if (currentBalance < amount) {
            return {
                success: false,
                message: `موجودی کیف پول شما (${currentBalance.toLocaleString()}$) برای برداشت مبلغ ${amount.toLocaleString()}$ کافی نیست.`,
            };
        }

        // Check for an existing 'pending' withdrawal request
        const pendingWithdrawalsQuery = query(
            collection(db, 'withdrawals'),
            where('userId', '==', userId),
            where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingWithdrawalsQuery);

        if (!pendingSnapshot.empty) {
            return {
                success: false,
                message: 'شما از قبل یک درخواست برداشت در انتظار بررسی دارید. لطفاً تا زمان پردازش آن صبر کنید.',
            };
        }
         if (amount < settings.minWithdrawalAmount) {
            return {
                success: false,
                message: `حداقل مبلغ برای برداشت ${settings.minWithdrawalAmount} دلار است.`,
            };
        }

        await runTransaction(db, async (transaction) => {
            // Calculate fees and net amount
            const exitFee = amount * (settings.exitFee / 100);
            const networkFee = settings.networkFee || 0;
            const totalFees = exitFee + networkFee;
            const netAmount = amount - totalFees;

            if (netAmount <= 0) {
                throw new Error("مبلغ درخواستی پس از کسر کارمزدها باید مثبت باشد.");
            }

            // A. Create the withdrawal document
            const withdrawalRef = doc(collection(db, 'withdrawals'));
            const newWithdrawal = {
                userId,
                amount,
                walletAddress,
                status: 'pending', // pending, approved, rejected, completed
                createdAt: serverTimestamp(),
                exitFee: exitFee,
                networkFee: networkFee,
                netAmount: netAmount,
            };
            transaction.set(withdrawalRef, newWithdrawal);

            // B. Create a corresponding 'pending' transaction record for the user's history
            // This is crucial for the new balance calculation logic.
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId,
                type: 'withdrawal_request',
                amount: -amount, // Make it a negative value as it's a debit
                status: 'pending',
                createdAt: serverTimestamp(),
                details: `درخواست برداشت به آدرس ${walletAddress}`,
                withdrawalId: withdrawalRef.id // Link transaction to withdrawal request
            });
        });

        return {
            success: true,
            message: "درخواست برداشت شما با موفقیت ثبت شد و پس از بررسی توسط مدیر (ظرف ۲۴ ساعت کاری)، واریز خواهد شد.",
        };
    } catch (e) {
        console.error("Error creating withdrawal request: ", e);
        const errorMessage = e instanceof Error ? e.message : "خطایی در ثبت درخواست شما در پایگاه داده رخ داد.";
        return {
            success: false,
            message: errorMessage,
        };
    }
  }
);

    