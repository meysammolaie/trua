
'use server';
/**
 * @fileOverview A flow for marking a user's notification as read.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const MarkNotificationAsReadInputSchema = z.object({
  userId: z.string(),
  notificationId: z.string(),
});
export type MarkNotificationAsReadInput = z.infer<typeof MarkNotificationAsReadInputSchema>;

const MarkNotificationAsReadOutputSchema = z.object({
  success: z.boolean(),
});
export type MarkNotificationAsReadOutput = z.infer<typeof MarkNotificationAsReadOutputSchema>;

export async function markNotificationAsRead(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadOutput> {
  return await markNotificationAsReadFlow(input);
}

const markNotificationAsReadFlow = ai.defineFlow(
  {
    name: 'markNotificationAsReadFlow',
    inputSchema: MarkNotificationAsReadInputSchema,
    outputSchema: MarkNotificationAsReadOutputSchema,
  },
  async ({ userId, notificationId }) => {
    try {
      const notificationRef = doc(db, `users/${userId}/notifications`, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false };
    }
  }
);
