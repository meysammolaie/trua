
'use server';
/**
 * @fileOverview A flow for fetching withdrawal requests for the admin panel.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

const WithdrawalRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userFullName: z.string(),
  userEmail: z.string(),
  amount: z.number(),
  exitFee: z.number(),
  networkFee: z.number().optional(),
  netAmount: z.number(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  createdAt: z.string(),
});
export type WithdrawalRequest = z.infer<typeof WithdrawalRequestSchema>;

const StatsSchema = z.object({
    platformWallet: z.number(),
    totalPending: z.number(),
    pendingCount: z.number(),
});

const GetAllWithdrawalsOutputSchema = z.object({
  requests: z.array(WithdrawalRequestSchema),
  stats: StatsSchema,
});
export type GetAllWithdrawalsOutput = z.infer<typeof GetAllWithdrawalsOutputSchema>;

// Firestore Document Types
type UserDocument = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
};
type WithdrawalDocument = Omit<WithdrawalRequest, 'id' | 'userFullName' | 'userEmail' | 'createdAt'> & { createdAt: Timestamp };
type DailyFeeDocument = {
    id: string;
    type: 'entry_fee' | 'exit_fee' | 'lottery_fee' | 'platform_fee';
    amount: number;
    distributed: boolean;
    fundId: string;
}


export async function getWithdrawalRequests(): Promise<GetAllWithdrawalsOutput> {
  return await getWithdrawalRequestsFlow({});
}

const getWithdrawalRequestsFlow = ai.defineFlow(
  {
    name: 'getWithdrawalRequestsFlow',
    inputSchema: z.object({}),
    outputSchema: GetAllWithdrawalsOutputSchema,
  },
  async () => {
    // 1. Fetch all necessary data in parallel
    const usersCollection = collection(db, "users");
    const withdrawalsCollection = collection(db, "withdrawals");
    const feesQuery = query(collection(db, "daily_fees"));

    const [usersSnapshot, withdrawalsSnapshot, feesSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(withdrawalsCollection, orderBy("createdAt", "desc"))),
      getDocs(feesQuery),
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    // 2. Map requests
    const requests = withdrawalsSnapshot.docs.map(doc => {
        const data = doc.data() as WithdrawalDocument;
        const user = usersMap.get(data.userId);
        return {
            ...data,
            id: doc.id,
            userFullName: user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص',
            userEmail: user ? user.email : 'ایمیل نامشخص',
            createdAt: data.createdAt.toDate().toLocaleDateString('fa-IR'),
        };
    });

    // 3. Calculate stats
    const totalPending = requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    
    // NEW: Accurate Platform Wallet Calculation
    // Platform wallet = (All platform fees + all lottery fees) - (all completed profit payouts + all commissions)
    const allFees = feesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as DailyFeeDocument));
    const platformIncome = allFees.filter(f => f.type === 'platform_fee').reduce((sum, f) => sum + f.amount, 0);
    
    // For now, we assume the platform wallet is the income generated from its 1% fee.
    // A more complex calculation would track all transactions in/out of a "platform" account.
    const platformWallet = platformIncome;


    return { 
      requests,
      stats: {
        platformWallet,
        totalPending,
        pendingCount,
      }
    };
  }
);
