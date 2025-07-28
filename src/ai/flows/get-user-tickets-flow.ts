
'use server';
/**
 * @fileOverview A flow for fetching a user's support tickets.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const GetUserTicketsInputSchema = z.object({
  userId: z.string(),
});
export type GetUserTicketsInput = z.infer<typeof GetUserTicketsInputSchema>;

const TicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  status: z.string(),
  priority: z.string(),
  updatedAt: z.string(),
});
export type Ticket = z.infer<typeof TicketSchema>;

const GetUserTicketsOutputSchema = z.array(TicketSchema);
export type GetUserTicketsOutput = z.infer<typeof GetUserTicketsOutputSchema>;

export async function getUserTickets(input: GetUserTicketsInput): Promise<GetUserTicketsOutput> {
  return await getUserTicketsFlow(input);
}

const getUserTicketsFlow = ai.defineFlow(
  {
    name: 'getUserTicketsFlow',
    inputSchema: GetUserTicketsInputSchema,
    outputSchema: GetUserTicketsOutputSchema,
  },
  async ({ userId }) => {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('userId', '==', userId), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const tickets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          subject: data.subject,
          status: data.status,
          priority: data.priority,
          updatedAt: (data.updatedAt as Timestamp).toDate().toLocaleString('fa-IR'),
        };
      });

      return tickets;
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      return [];
    }
  }
);
