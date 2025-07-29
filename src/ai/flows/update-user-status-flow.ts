
'use server';
/**
 * @fileOverview A flow for updating a user's status.
 *
 * - updateUserStatus - Handles updating a user document in Firestore.
 * - UpdateUserStatusInput - The input type for the function.
 * - UpdateUserStatusOutput - The return type for the function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

// Input Schema
const UpdateUserStatusInputSchema = z.object({
  userId: z.string().describe('The UID of the user to update.'),
  newStatus: z.enum(['active', 'blocked']).describe('The new status for the user.'),
});
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusInputSchema>;

// Output Schema
const UpdateUserStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateUserStatusOutput = z.infer<typeof UpdateUserStatusOutputSchema>;


export async function updateUserStatus(input: UpdateUserStatusInput): Promise<UpdateUserStatusOutput> {
    return await updateUserStatusFlow(input);
}


const updateUserStatusFlow = ai.defineFlow(
  {
    name: 'updateUserStatusFlow',
    inputSchema: UpdateUserStatusInputSchema,
    outputSchema: UpdateUserStatusOutputSchema,
  },
  async ({ userId, newStatus }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus,
      });

      console.log(`User ${userId} status updated to ${newStatus}.`);

      const message = newStatus === 'blocked' 
        ? `User with ID ${userId} has been successfully blocked.`
        : `User with ID ${userId} has been successfully activated.`;

      return {
        success: true,
        message: message,
      };

    } catch (error) {
      console.error(`Error updating user ${userId} status:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `An error occurred while updating the user status: ${errorMessage}`,
      };
    }
  }
);
