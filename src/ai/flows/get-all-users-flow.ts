'use server';
/**
 * @fileOverview A flow for fetching all users from Firestore along with their aggregated data.
 *
 * - getAllUsers - Fetches all registered users and calculates their total investment.
 * - GetAllUsersOutput - The return type for the getAllUsers function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

const GetAllUsersInputSchema = z.object({});
export type GetAllUsersInput = z.infer<typeof GetAllUsersInputSchema>;

const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.string(), // Sending as string for client
  totalInvestment: z.number(),
  status: z.enum(['active', 'blocked']),
});

export type User = z.infer<typeof UserSchema>;

const GetAllUsersOutputSchema = z.object({
  users: z.array(UserSchema),
});
export type GetAllUsersOutput = z.infer<typeof GetAllUsersOutputSchema>;

// Firestore data structure for a user
type UserDocument = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Timestamp;
  status: 'active' | 'blocked';
};

// Firestore data structure for an investment
type InvestmentDocument = {
  userId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed';
};

export async function getAllUsers(input: GetAllUsersInput = {}): Promise<GetAllUsersOutput> {
  return await getAllUsersFlow(input);
}

const getAllUsersFlow = ai.defineFlow(
  {
    name: 'getAllUsersFlow',
    inputSchema: GetAllUsersInputSchema,
    outputSchema: GetAllUsersOutputSchema,
  },
  async () => {
    
    // 1. Fetch all users and investments in parallel
    const usersCollection = collection(db, "users");
    const investmentsCollection = collection(db, "investments");

    const [usersSnapshot, investmentsSnapshot] = await Promise.all([
        getDocs(query(usersCollection, orderBy("createdAt", "desc"))),
        getDocs(collection(db, "investments"))
    ]);

    const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserDocument));
    const investments = investmentsSnapshot.docs.map(doc => doc.data() as InvestmentDocument);
    
    // 2. Calculate total investment for each user
    const investmentsByUser = new Map<string, number>();
    investments.forEach(inv => {
        if (inv.status === 'active' || inv.status === 'pending') {
            const currentTotal = investmentsByUser.get(inv.userId) || 0;
            investmentsByUser.set(inv.userId, currentTotal + inv.amount);
        }
    });

    // 3. Map users to the final output schema
    const usersData = users.map(user => {
        return {
            uid: user.uid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt.toDate().toLocaleDateString('fa-IR'),
            totalInvestment: investmentsByUser.get(user.uid) || 0,
            status: user.status || 'active', // Default to active if not set
        };
    });

    return {
      users: usersData,
    };
  }
);
