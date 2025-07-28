
'use server';
/**
 * @fileOverview A flow for creating notifications for users.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, getDocs, doc } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const CreateNotificationInputSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Message is required.'),
  target: z.enum(['all', 'specific']),
  userId: z.string().optional(), // Required if target is 'specific'
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationInputSchema>;

const CreateNotificationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type CreateNotificationOutput = z.infer<typeof CreateNotificationOutputSchema>;

export async function createNotification(input: CreateNotificationInput): Promise<CreateNotificationOutput> {
  return await createNotificationFlow(input);
}

const createNotificationFlow = ai.defineFlow(
  {
    name: 'createNotificationFlow',
    inputSchema: CreateNotificationInputSchema,
    outputSchema: CreateNotificationOutputSchema,
  },
  async ({ title, message, target, userId }) => {
    try {
      if (target === 'specific' && !userId) {
        throw new Error('User ID is required for specific notifications.');
      }

      const notificationData = {
        title,
        message,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      if (target === 'all') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (usersSnapshot.empty) {
          return { success: true, message: 'No users found to send notification to.' };
        }
        
        const batch = writeBatch(db);
        usersSnapshot.forEach(userDoc => {
          const notificationRef = doc(collection(db, `users/${userDoc.id}/notifications`));
          batch.set(notificationRef, notificationData);
        });
        await batch.commit();

        return { success: true, message: `Notification sent to all ${usersSnapshot.size} users.` };

      } else if (target === 'specific') {
         if (!userId) {
            throw new Error("User ID is required for specific notification.");
        }
        const notificationsCollection = collection(db, `users/${userId}/notifications`);
        await addDoc(notificationsCollection, notificationData);
        return { success: true, message: 'Notification sent successfully.' };
      }
      
      return { success: false, message: 'Invalid target specified.' };

    } catch (e) {
      console.error("Error creating notification: ", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      return {
        success: false,
        message: `Failed to create notification: ${errorMessage}`,
      };
    }
  }
);
