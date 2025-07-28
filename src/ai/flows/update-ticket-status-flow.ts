
'use server';
/**
 * @fileOverview A flow for updating the status of a support ticket.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

export const UpdateTicketStatusInputSchema = z.object({
  ticketId: z.string(),
  newStatus: z.enum(['open', 'in_progress', 'closed']),
});
export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusInputSchema>;

export const UpdateTicketStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateTicketStatusOutput = z.infer<typeof UpdateTicketStatusOutputSchema>;

export async function updateTicketStatus(input: UpdateTicketStatusInput): Promise<UpdateTicketStatusOutput> {
  return await updateTicketStatusFlow(input);
}

const updateTicketStatusFlow = ai.defineFlow(
  {
    name: 'updateTicketStatusFlow',
    inputSchema: UpdateTicketStatusInputSchema,
    outputSchema: UpdateTicketStatusOutputSchema,
  },
  async ({ ticketId, newStatus }) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: `وضعیت تیکت با موفقیت به '${newStatus}' تغییر یافت.`,
      };
    } catch (e) {
      console.error("Error updating ticket status: ", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      return {
        success: false,
        message: `Failed to update status: ${errorMessage}`,
      };
    }
  }
);
