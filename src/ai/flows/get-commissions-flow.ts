
'use server';
/**
 * @fileOverview A flow for fetching referral commissions for the admin panel.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

// Schema for a single commission record
const CommissionSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  referrerFullName: z.string(),
  referredUserId: z.string(),
  referredUserFullName: z.string(),
  investmentId: z.string(),
  investmentAmount: z.number(),
  commissionAmount: z.number(),
  createdAt: z.string(),
  createdAtTimestamp: z.number(),
});
export type Commission = z.infer<typeof CommissionSchema>;

// Output schema for the flow
const GetAllCommissionsOutputSchema = z.object({
  commissions: z.array(CommissionSchema),
  stats: z.object({
    totalCommissionsPaid: z.number(),
    totalReferredInvestments: z.number(),
    commissionCount: z.number(),
  }),
});
export type GetAllCommissionsOutput = z.infer<typeof GetAllCommissionsOutputSchema>;

// Firestore Document Types
type UserDocument = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
};
type CommissionDocument = Omit<Commission, 'id' | 'referrerFullName' | 'referredUserFullName' | 'createdAt' | 'createdAtTimestamp'> & { createdAt: Timestamp };

export async function getCommissions(): Promise<GetAllCommissionsOutput> {
  return await getCommissionsFlow({});
}

const getCommissionsFlow = ai.defineFlow(
  {
    name: 'getCommissionsFlow',
    inputSchema: z.object({}),
    outputSchema: GetAllCommissionsOutputSchema,
  },
  async () => {
    // 1. Fetch all users and commissions in parallel
    const usersCollection = collection(db, "users");
    const commissionsCollection = collection(db, "commissions");

    const [usersSnapshot, commissionsSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(commissionsCollection, orderBy("createdAt", "desc")))
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    // 2. Map commissions to output schema and calculate stats
    let totalCommissionsPaid = 0;
    let totalReferredInvestments = 0;

    const commissions = commissionsSnapshot.docs.map(doc => {
        const data = doc.data() as CommissionDocument;
        const referrer = usersMap.get(data.referrerId);
        const referredUser = usersMap.get(data.referredUserId);

        totalCommissionsPaid += data.commissionAmount;
        totalReferredInvestments += data.investmentAmount;

        return {
            ...data,
            id: doc.id,
            referrerFullName: referrer ? `${referrer.firstName} ${referrer.lastName}`.trim() : 'کاربر نامشخص',
            referredUserFullName: referredUser ? `${referredUser.firstName} ${referredUser.lastName}`.trim() : 'کاربر نامشخص',
            createdAt: data.createdAt.toDate().toLocaleDateString('fa-IR'),
            createdAtTimestamp: data.createdAt.toMillis(),
        };
    });

    return { 
        commissions,
        stats: {
            totalCommissionsPaid,
            totalReferredInvestments,
            commissionCount: commissions.length,
        }
    };
  }
);
