
'use server';
/**
 * @fileOverview A flow for handling new withdrawal requests.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, Timestamp, runTransaction, increment } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

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

    // 2. Get platform settings
    const settings = await getPlatformSettings();
    
    // 3. Check for an existing 'pending' withdrawal request
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

    // 4. Check withdrawal rules
    if (amount < settings.minWithdrawalAmount) {
        return {
            success: false,
            message: `حداقل مبلغ برای برداشت ${settings.minWithdrawalAmount} دلار است.`,
        };
    }
    
    // 5. Calculate fees and net amount
    const exitFee = amount * (settings.exitFee / 100);
    const networkFee = settings.networkFee || 0;
    const totalFees = exitFee + networkFee;
    const netAmount = amount - totalFees;

     if (netAmount <= 0) {
        return {
            success: false,
            message: "مبلغ درخواستی پس از کسر کارمزدها باید مثبت باشد.",
        };
    }

    // 6. Create withdrawal request and deduct from balance in a transaction
    try {
        const userRef = doc(db, 'users', userId);

        await runTransaction(db, async (transaction) => {
            // Re-verify user balance within the transaction to prevent race conditions
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                 throw new Error("کاربر یافت نشد.");
            }
            const remoteBalance = userDoc.data().walletBalance || 0;

            if (remoteBalance < amount) {
                throw new Error(`موجودی کیف پول شما (${remoteBalance.toLocaleString()}$) برای برداشت مبلغ ${amount.toLocaleString()}$ کافی نیست.`);
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
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId,
                type: 'withdrawal_request',
                amount: -amount,
                status: 'pending',
                createdAt: serverTimestamp(),
                details: `درخواست برداشت به آدرس ${walletAddress}`,
                withdrawalId: withdrawalRef.id // Link transaction to withdrawal request
            });

            // C. Deduct the amount from user's walletBalance
            transaction.update(userRef, { walletBalance: increment(-amount) });
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
