
'use server';
/**
 * @fileOverview A flow for fetching details of a single support ticket.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const GetTicketDetailsInputSchema = z.object({
  ticketId: z.string(),
});
export type GetTicketDetailsInput = z.infer<typeof GetTicketDetailsInputSchema>;

const TicketMessageSchema = z.object({
    id: z.string(),
    senderId: z.string(),
    message: z.string(),
    createdAt: z.string(),
});

const GetTicketDetailsOutputSchema = z.object({
    id: z.string(),
    subject: z.string(),
    status: z.string(),
    userId: z.string(),
    userFullName: z.string(),
    createdAt: z.string(),
    messages: z.array(TicketMessageSchema),
});
export type GetTicketDetailsOutput = z.infer<typeof GetTicketDetailsOutputSchema>;


export async function getTicketDetails(input: GetTicketDetailsInput): Promise<GetTicketDetailsOutput> {
  return await getTicketDetailsFlow(input);
}

const getTicketDetailsFlow = ai.defineFlow(
  {
    name: 'getTicketDetailsFlow',
    inputSchema: GetTicketDetailsInputSchema,
    outputSchema: GetTicketDetailsOutputSchema,
  },
  async ({ ticketId }) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        throw new Error(`Ticket with ID ${ticketId} not found.`);
      }
      const ticketData = ticketSnap.data();

      const messagesRef = collection(ticketRef, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const messagesSnap = await getDocs(q);

      const messages = messagesSnap.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              senderId: data.senderId,
              message: data.message,
              createdAt: (data.createdAt as Timestamp).toDate().toLocaleString('fa-IR'),
          }
      });
      
      return {
        id: ticketSnap.id,
        subject: ticketData.subject,
        status: ticketData.status,
        userId: ticketData.userId,
        userFullName: ticketData.userFullName,
        createdAt: (ticketData.createdAt as Timestamp).toDate().toLocaleString('fa-IR'),
        messages,
      };

    } catch (error) {
      console.error("Error fetching ticket details:", error);
      throw error; // Re-throw to be handled by the caller
    }
  }
);
