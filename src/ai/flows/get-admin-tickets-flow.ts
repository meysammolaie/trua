
'use server';
/**
 * @fileOverview A flow for fetching all support tickets for the admin panel.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const AdminTicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  userFullName: z.string(),
  status: z.string(),
  priority: z.string(),
  updatedAt: z.string(),
});
export type AdminTicket = z.infer<typeof AdminTicketSchema>;

const GetAdminTicketsOutputSchema = z.object({
    tickets: z.array(AdminTicketSchema),
    stats: z.object({
        open: z.number(),
        in_progress: z.number(),
        closed: z.number(),
        total: z.number(),
    })
});
export type GetAdminTicketsOutput = z.infer<typeof GetAdminTicketsOutputSchema>;

export async function getAdminTickets(): Promise<GetAdminTicketsOutput> {
  return await getAdminTicketsFlow({});
}

const getAdminTicketsFlow = ai.defineFlow(
  {
    name: 'getAdminTicketsFlow',
    inputSchema: z.object({}),
    outputSchema: GetAdminTicketsOutputSchema,
  },
  async () => {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const stats = { open: 0, in_progress: 0, closed: 0, total: 0 };
      const tickets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const status = data.status as keyof typeof stats;
        if (status in stats) {
            stats[status]++;
        }
        stats.total++;
        return {
          id: doc.id,
          subject: data.subject,
          userFullName: data.userFullName,
          status: data.status,
          priority: data.priority,
          updatedAt: (data.updatedAt as Timestamp).toDate().toLocaleString('en-US'),
        };
      });

      return { tickets, stats };
    } catch (error) {
      console.error("Error fetching admin tickets:", error);
      return { tickets: [], stats: { open: 0, in_progress: 0, closed: 0, total: 0 } };
    }
  }
);
