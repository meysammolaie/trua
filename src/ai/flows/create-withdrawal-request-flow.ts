
'use server';
/**
 * @fileOverview A flow for handling new withdrawal requests.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
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
    
    // 3. Check for recent withdrawals (within last 24 hours) - CODE-BASED APPROACH
    const withdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('userId', '==', userId)
    );
    const withdrawalsSnapshot = await getDocs(withdrawalsQuery);

    if (!withdrawalsSnapshot.empty) {
        // Sort documents by createdAt timestamp descending in code
        const sortedWithdrawals = withdrawalsSnapshot.docs.sort((a, b) => {
            const timeA = a.data().createdAt?.toMillis() || 0;
            const timeB = b.data().createdAt?.toMillis() || 0;
            return timeB - timeA;
        });
        
        const lastWithdrawal = sortedWithdrawals[0].data();
        if (lastWithdrawal.createdAt) {
            const lastWithdrawalTime = (lastWithdrawal.createdAt as Timestamp).toMillis();
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

            if (lastWithdrawalTime > twentyFourHoursAgo) {
                 return {
                    success: false,
                    message: 'شما در ۲۴ ساعت گذشته یک درخواست برداشت ثبت کرده‌اید. لطفاً بعداً تلاش کنید.',
                };
            }
        }
    }

    // 4. Check withdrawal rules
    if (amount < settings.minWithdrawalAmount) {
        return {
            success: false,
            message: `حداقل مبلغ برای برداشت ${settings.minWithdrawalAmount} دلار است.`,
        };
    }

    // 5. Check user balance from their wallet
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return { success: false, message: "کاربر یافت نشد." };
    }
    const userBalance = userSnap.data().walletBalance || 0;
    
    const exitFee = amount * (settings.exitFee / 100);
    const networkFee = settings.networkFee || 0;
    const totalFees = exitFee + networkFee;
    const netAmount = amount - totalFees;


    if (amount > userBalance) {
        return {
            success: false,
            message: "مبلغ درخواستی از موجودی کیف پول شما بیشتر است.",
        };
    }
    
     if (netAmount <= 0) {
        return {
            success: false,
            message: "مبلغ درخواستی پس از کسر کارمزدها باید مثبت باشد.",
        };
    }

    // 6. Create withdrawal request
    try {
        await addDoc(collection(db, 'withdrawals'), {
            userId,
            amount,
            walletAddress,
            status: 'pending', // pending, approved, rejected, completed
            createdAt: serverTimestamp(),
            exitFee: exitFee,
            networkFee: networkFee,
            netAmount: netAmount,
        });

        return {
            success: true,
            message: "درخواست برداشت شما با موفقیت ثبت شد و پس از بررسی توسط مدیر (ظرف ۲۴ ساعت کاری)، واریز خواهد شد.",
        };
    } catch (e) {
        console.error("Error creating withdrawal request: ", e);
        return {
            success: false,
            message: "خطایی در ثبت درخواست شما در پایگاه داده رخ داد.",
        };
    }
  }
);
