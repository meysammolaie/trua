
'use server';
/**
 * @fileOverview A flow for fetching user notifications.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const GetUserNotificationsInputSchema = z.object({
  userId: z.string(),
  count: z.number().optional().default(10),
});
export type GetUserNotificationsInput = z.infer<typeof GetUserNotificationsInputSchema>;

const NotificationSchema = z.object({
    id: z.string(),
    title: z.string(),
    message: z.string(),
    isRead: z.boolean(),
    createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

const GetUserNotificationsOutputSchema = z.object({
    notifications: z.array(NotificationSchema),
    unreadCount: z.number(),
});
export type GetUserNotificationsOutput = z.infer<typeof GetUserNotificationsOutputSchema>;

export async function getUserNotifications(input: GetUserNotificationsInput): Promise<GetUserNotificationsOutput> {
  return await getUserNotificationsFlow(input);
}

const getUserNotificationsFlow = ai.defineFlow(
  {
    name: 'getUserNotificationsFlow',
    inputSchema: GetUserNotificationsInputSchema,
    outputSchema: GetUserNotificationsOutputSchema,
  },
  async ({ userId, count }) => {
    try {
      const notificationsRef = collection(db, `users/${userId}/notifications`);
      const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(count));
      const querySnapshot = await getDocs(q);

      let unreadCount = 0;
      const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.isRead) {
            unreadCount++;
        }
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          isRead: data.isRead,
          createdAt: (data.createdAt as Timestamp).toDate().toLocaleDateString('fa-IR'),
        };
      });

      return { notifications, unreadCount };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  }
);
