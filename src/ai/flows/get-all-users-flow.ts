
'use server';
/**
 * @fileOverview A flow for fetching all users from Firestore.
 *
 * - getAllUsers - Fetches all registered users.
 * - GetAllUsersOutput - The return type for the getAllUsers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.string(), // Sending as string for client
  // In a real app, you might have more fields like totalInvestment, status, etc.
  totalInvestment: z.number().default(0),
  status: z.string().default("فعال"),
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
};

export async function getAllUsers(): Promise<GetAllUsersOutput> {
  return await getAllUsersFlow();
}

const getAllUsersFlow = ai.defineFlow(
  {
    name: 'getAllUsersFlow',
    inputSchema: z.undefined(),
    outputSchema: GetAllUsersOutputSchema,
  },
  async () => {
    
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data() as UserDocument;
        return {
            uid: data.uid,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            createdAt: data.createdAt.toDate().toLocaleDateString('fa-IR'),
            totalInvestment: 0, // This would be calculated in a real scenario
            status: "فعال", // This could also come from the user document
        };
    });

    return {
      users: usersData,
    };
  }
);
