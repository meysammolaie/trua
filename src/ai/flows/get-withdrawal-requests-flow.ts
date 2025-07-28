
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
    const investmentsCollection = collection(db, "investments");

    const [usersSnapshot, withdrawalsSnapshot, investmentsSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(withdrawalsCollection, orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "investments"), where("status", "==", "active"))),
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

    const totalActiveInvestment = investmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amountUSD || 0), 0);
    const totalCompletedWithdrawals = requests.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
    
    // Platform wallet is total active assets minus what has already been paid out.
    const platformWallet = totalActiveInvestment - totalCompletedWithdrawals;


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
