
'use server';
/**
 * @fileOverview A flow for fetching all investments from Firestore and their associated user data.
 * This is the new source of truth for the admin investments page.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

// Schema for a single investment record with user details
const InvestmentWithUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userFullName: z.string(),
  userEmail: z.string(),
  fundId: z.string(),
  amount: z.number(),
  amountUSD: z.number(),
  status: z.enum(['pending', 'active', 'completed', 'rejected']),
  createdAt: z.string(),
});
export type InvestmentWithUser = z.infer<typeof InvestmentWithUserSchema>;

// Output schema for the flow
const GetAllInvestmentsOutputSchema = z.object({
  investments: z.array(InvestmentWithUserSchema),
});
export type GetAllInvestmentsOutput = z.infer<typeof GetAllInvestmentsOutputSchema>;

// Firestore Document Types
type UserDocument = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
};

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  amountUSD: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  createdAt: Timestamp;
};

export async function getAllInvestments(): Promise<GetAllInvestmentsOutput> {
  return await getAllInvestmentsFlow({});
}

const getAllInvestmentsFlow = ai.defineFlow(
  {
    name: 'getAllInvestmentsFlow',
    inputSchema: z.object({}),
    outputSchema: GetAllInvestmentsOutputSchema,
  },
  async () => {
    // 1. Fetch all users and investments in parallel
    const usersCollection = collection(db, "users");
    const investmentsCollection = collection(db, "investments");

    const [usersSnapshot, investmentsSnapshot] = await Promise.all([
      getDocs(query(usersCollection)),
      getDocs(query(investmentsCollection, orderBy("createdAt", "desc")))
    ]);

    const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as UserDocument) }));
    const usersMap = new Map(usersData.map(user => [user.uid, user]));
    
    // 2. Map investments to the output schema
    const investments = investmentsSnapshot.docs.map(doc => {
        const data = doc.data() as InvestmentDocument;
        const user = usersMap.get(data.userId);

        return {
            id: doc.id,
            userId: data.userId,
            userFullName: user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص',
            userEmail: user ? user.email : 'ایمیل نامشخص',
            fundId: data.fundId,
            amount: data.amount,
            amountUSD: data.amountUSD,
            status: data.status,
            createdAt: data.createdAt.toDate().toLocaleDateString('fa-IR'),
        };
    });

    return { 
        investments,
    };
  }
);
