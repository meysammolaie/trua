
'use server';
/**
 * @fileOverview A flow for creating a new support ticket.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const CreateTicketInputSchema = z.object({
  userId: z.string(),
  subject: z.string().min(5, "Subject must be at least 5 characters long."),
  department: z.enum(['technical', 'financial', 'general']),
  priority: z.enum(['low', 'medium', 'high']),
  message: z.string().min(10, "Message must be at least 10 characters long."),
});
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

const CreateTicketOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  ticketId: z.string().optional(),
});
export type CreateTicketOutput = z.infer<typeof CreateTicketOutputSchema>;

export async function createTicket(input: CreateTicketInput): Promise<CreateTicketOutput> {
  return await createTicketFlow(input);
}

const createTicketFlow = ai.defineFlow(
  {
    name: 'createTicketFlow',
    inputSchema: CreateTicketInputSchema,
    outputSchema: CreateTicketOutputSchema,
  },
  async ({ userId, subject, department, priority, message }) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error("User not found.");
      }
      const userData = userSnap.data();

      const ticketsCollection = collection(db, 'tickets');
      const ticketDocRef = await addDoc(ticketsCollection, {
        userId,
        userFullName: `${userData.firstName} ${userData.lastName}`,
        userEmail: userData.email,
        subject,
        department,
        priority,
        status: 'open', // 'open', 'in_progress', 'closed'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add the initial message to the subcollection
      const messagesCollection = collection(ticketDocRef, 'messages');
      await addDoc(messagesCollection, {
        senderId: userId,
        message,
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        message: 'Your ticket has been created successfully.',
        ticketId: ticketDocRef.id,
      };
    } catch (e) {
      console.error("Error creating ticket: ", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      return {
        success: false,
        message: `Failed to create ticket: ${errorMessage}`,
      };
    }
  }
);
