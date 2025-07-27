
'use server';
/**
 * @fileOverview A flow for fetching withdrawal requests for the admin panel.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

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

const GetAllWithdrawalsOutputSchema = z.object({
  requests: z.array(WithdrawalRequestSchema),
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
    // 1. Fetch all users and withdrawal requests in parallel
    const usersCollection = collection(db, "users");
    const withdrawalsCollection = collection(db, "withdrawals");

    const [usersSnapshot, withdrawalsSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(withdrawalsCollection, orderBy("createdAt", "desc")))
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    const requests = withdrawalsSnapshot.docs.map(doc => {
        const data = doc.data() as WithdrawalDocument;
        const user = usersMap.get(data.userId);
        return {
            ...data,
            id: doc.id,
            userFullName: user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص',
            userEmail: user ? user.email : 'ایمیل نامشخص',
            exitFee: data.exitFee, // Keep existing field name from DB
            networkFee: data.networkFee,
            createdAt: data.createdAt.toDate().toLocaleDateString('fa-IR'),
        };
    });

    return { requests };
  }
);
