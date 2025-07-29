
'use server';
/**
 * @fileOverview A flow for adding a reply to a support ticket.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const AddTicketReplyInputSchema = z.object({
  ticketId: z.string(),
  senderId: z.string(),
  message: z.string().min(1, "Message cannot be empty."),
  isAdminReply: z.boolean().default(false),
});
export type AddTicketReplyInput = z.infer<typeof AddTicketReplyInputSchema>;

const AddTicketReplyOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type AddTicketReplyOutput = z.infer<typeof AddTicketReplyOutputSchema>;

export async function addTicketReply(input: AddTicketReplyInput): Promise<AddTicketReplyOutput> {
  return await addTicketReplyFlow(input);
}

const addTicketReplyFlow = ai.defineFlow(
  {
    name: 'addTicketReplyFlow',
    inputSchema: AddTicketReplyInputSchema,
    outputSchema: AddTicketReplyOutputSchema,
  },
  async ({ ticketId, senderId, message, isAdminReply }) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const messagesCollection = collection(ticketRef, 'messages');
      
      await addDoc(messagesCollection, {
        senderId,
        message,
        createdAt: serverTimestamp(),
      });

      const updatePayload: { updatedAt: any, status?: string } = {
        updatedAt: serverTimestamp(),
      };
      
      // If an admin replies, change status to 'in_progress'
      if (isAdminReply) {
        updatePayload.status = 'in_progress';
      }

      await updateDoc(ticketRef, updatePayload);

      return {
        success: true,
        message: 'Your reply has been submitted successfully.',
      };
    } catch (e) {
      console.error("Error adding reply: ", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      return {
        success: false,
        message: `Failed to add reply: ${errorMessage}`,
      };
    }
  }
);
