
'use server';
/**
 * @fileOverview A flow for unlocking bonuses for all eligible users.
 * This should be run by an admin when the unlock condition is met.
 */

import { genkit } from 'genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});

const UnlockBonusesOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  unlockedCount: z.number(),
});

export async function unlockBonuses(): Promise<z.infer<typeof UnlockBonusesOutputSchema>> {
  return await unlockBonusesFlow({});
}

const unlockBonusesFlow = ai.defineFlow(
  {
    name: 'unlockBonusesFlow',
    inputSchema: z.object({}),
    outputSchema: UnlockBonusesOutputSchema,
  },
  async () => {
    try {
      const bonusesToUnlockQuery = query(collection(db, 'bonuses'), where('status', '==', 'locked'));
      const snapshot = await getDocs(bonusesToUnlockQuery);
      
      if (snapshot.empty) {
        return { success: true, message: 'No locked bonuses found to unlock.', unlockedCount: 0 };
      }
      
      const batch = writeBatch(db);
      let unlockedCount = 0;

      snapshot.forEach(bonusDoc => {
        const bonusData = bonusDoc.data();
        
        // 1. Mark the bonus as 'unlocked'
        batch.update(bonusDoc.ref, { 
            status: 'unlocked',
            unlockedAt: serverTimestamp()
        });

        // 2. Create a real cash transaction to credit the user's wallet
        const transactionRef = doc(collection(db, 'transactions'));
        batch.set(transactionRef, {
            userId: bonusData.userId,
            type: 'bonus',
            amount: bonusData.amount,
            status: 'completed',
            createdAt: serverTimestamp(),
            details: 'Initial signup bonus unlocked',
            bonusId: bonusDoc.id,
        });

        unlockedCount++;
      });
      
      await batch.commit();

      return {
        success: true,
        message: `Bonus amount successfully unlocked and added to the wallet for ${unlockedCount} users.`,
        unlockedCount: unlockedCount,
      };

    } catch (error) {
      console.error("Error unlocking bonuses:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      return {
        success: false,
        message: `An error occurred while unlocking bonuses: ${errorMessage}`,
        unlockedCount: 0,
      };
    }
  }
);
