
'use server';
/**
 * @fileOverview A flow for creating a new task for users.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

export const CreateTaskInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  rewardAmount: z.number(),
  rewardType: z.enum(["usd", "gold"]),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const CreateTaskOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  taskId: z.string().optional(),
});
export type CreateTaskOutput = z.infer<typeof CreateTaskOutputSchema>;

export async function createTask(input: CreateTaskInput): Promise<CreateTaskOutput> {
  return await createTaskFlow(input);
}

const createTaskFlow = ai.defineFlow(
  {
    name: 'createTaskFlow',
    inputSchema: CreateTaskInputSchema,
    outputSchema: CreateTaskOutputSchema,
  },
  async (input) => {
    try {
      const tasksCollection = collection(db, 'tasks');
      const docRef = await addDoc(tasksCollection, {
        ...input,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        message: 'Task created successfully.',
        taskId: docRef.id,
      };
    } catch (e) {
      console.error("Error creating task: ", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      return {
        success: false,
        message: `Failed to create task: ${errorMessage}`,
      };
    }
  }
);
