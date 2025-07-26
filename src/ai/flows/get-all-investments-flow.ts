'use server';
/**
 * @fileOverview A flow for fetching all investments from Firestore along with their user data.
 *
 * - getAllInvestments - Fetches all investments and calculates aggregate stats.
 * - InvestmentWithUser - The type for a single investment record with user details.
 * - GetAllInvestmentsOutput - The return type for the getAllInvestments function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

// Sub-schemas
const InvestmentWithUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userFullName: z.string(),
  userEmail: z.string(),
  fundId: z.string(),
  amount: z.number(),
  status: z.enum(['pending', 'active', 'completed']),
  createdAt: z.string(),
});
export type InvestmentWithUser = z.infer<typeof InvestmentWithUserSchema>;

const StatsSchema = z.object({
  totalAmount: z.number(),
  activeCount: z.number(),
  averageAmount: z.number(),
});

// Main Output Schema
const GetAllInvestmentsOutputSchema = z.object({
  investments: z.array(InvestmentWithUserSchema),
  stats: StatsSchema,
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
  status: 'pending' | 'active' | 'completed';
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
    
    const investments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as InvestmentDocument) }));

    // 2. Combine investment data with user data
    const investmentsWithUserData: InvestmentWithUser[] = investments.map(inv => {
      const user = usersMap.get(inv.userId);
      const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'کاربر نامشخص';
      const userEmail = user ? user.email : 'ایمیل نامشخص';
      
      return {
        id: inv.id,
        userId: inv.userId,
        userFullName,
        userEmail,
        fundId: inv.fundId,
        amount: inv.amount,
        status: inv.status,
        createdAt: inv.createdAt.toDate().toLocaleDateString('fa-IR'),
      };
    });

    // 3. Calculate stats
    const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeCount = investments.filter(inv => ['active', 'pending'].includes(inv.status)).length;
    const averageAmount = investments.length > 0 ? totalAmount / investments.length : 0;

    return {
      investments: investmentsWithUserData,
      stats: {
        totalAmount,
        activeCount,
        averageAmount,
      },
    };
  }
);
