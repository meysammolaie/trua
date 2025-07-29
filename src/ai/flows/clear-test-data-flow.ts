
'use server';
/**
 * @fileOverview A flow for clearing all test data from Firestore.
 * This is a destructive operation and should be used with extreme caution.
 */

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, deleteDoc, getDoc } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

const ClearTestDataOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function clearTestData(): Promise<z.infer<typeof ClearTestDataOutputSchema>> {
  return await clearTestDataFlow();
}

const clearTestDataFlow = ai.defineFlow(
  {
    name: 'clearTestDataFlow',
    inputSchema: z.object({}),
    outputSchema: ClearTestDataOutputSchema,
  },
  async () => {
    try {
      const batch = writeBatch(db);
      let deletedUsersCount = 0;
      const collectionsToDelete = [
        'investments', 
        'transactions', 
        'commissions', 
        'tickets', 
        'withdrawals',
        'login_history',
        'bonuses',
      ];

      // 1. Get all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const userIdsToDelete: string[] = [];
      
      // 2. Filter out the admin user
      usersSnapshot.forEach(userDoc => {
        if (userDoc.data().email !== 'admin@example.com') {
          userIdsToDelete.push(userDoc.id);
        }
      });
      
      if (userIdsToDelete.length === 0) {
        return { success: true, message: 'No test users found to delete.' };
      }

      // 3. For each user to delete, find and delete their related data in other collections
      for (const userId of userIdsToDelete) {
        for (const collectionName of collectionsToDelete) {
          const q = query(collection(db, collectionName), where('userId', '==', userId));
          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
        }
        
        // Also delete their notifications subcollection
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        const notificationsSnapshot = await getDocs(notificationsRef);
        notificationsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Finally, mark the user document itself for deletion
        batch.delete(doc(db, 'users', userId));
        deletedUsersCount++;
      }
      
       // 4. Clear collections not tied to a specific user
       const collectionsToClear = ['daily_fees', 'lottery_winners', 'tasks'];
       for (const collectionName of collectionsToClear) {
           const snapshot = await getDocs(collection(db, collectionName));
           snapshot.forEach(doc => {
               batch.delete(doc.ref);
           });
       }


      // 5. Commit all deletions in a single batch
      await batch.commit();
      
      return {
        success: true,
        message: `Successfully cleared all test data. Deleted ${deletedUsersCount} users and all their associated documents.`,
      };

    } catch (error) {
      console.error("Error clearing test data:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      return {
        success: false,
        message: `An error occurred while clearing data: ${errorMessage}`,
      };
    }
  }
);
