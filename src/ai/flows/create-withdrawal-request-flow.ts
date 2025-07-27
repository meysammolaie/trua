
'use server';
/**
 * @fileOverview A flow for handling new withdrawal requests.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getPlatformSettings } from './platform-settings-flow';

const CreateWithdrawalRequestInputSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  walletAddress: z.string(),
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
  async ({ userId, amount, walletAddress }) => {
    
    // 1. Get platform settings
    const settings = await getPlatformSettings();

    // 2. Check withdrawal rules
    const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    if (today !== settings.withdrawalDay) {
        return {
            success: false,
            message: `امکان برداشت فقط در روزهای ${settings.withdrawalDay} مجاز است.`,
        };
    }
    
    if (amount < settings.minWithdrawalAmount) {
        return {
            success: false,
            message: `حداقل مبلغ برای برداشت ${settings.minWithdrawalAmount} دلار است.`,
        };
    }

    // 3. Check user balance from their wallet
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

    // 4. Create withdrawal request
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
            message: "درخواست برداشت شما با موفقیت ثبت شد و پس از بررسی توسط مدیر، واریز خواهد شد.",
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
