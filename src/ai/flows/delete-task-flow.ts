
'use server';
/**
 * @fileOverview A flow for deleting a task.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

export const DeleteTaskInputSchema = z.object({
  taskId: z.string(),
});
export type DeleteTaskInput = z.infer<typeof DeleteTaskInputSchema>;

export const DeleteTaskOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteTaskOutput = z.infer<typeof DeleteTaskOutputSchema>;

export async function deleteTask(input: DeleteTaskInput): Promise<DeleteTaskOutput> {
  return await deleteTaskFlow(input);
}

const deleteTaskFlow = ai.defineFlow(
  {
    name: 'deleteTaskFlow',
    inputSchema: DeleteTaskInputSchema,
    outputSchema: DeleteTaskOutputSchema,
  },
  async ({ taskId }) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);

      return {
        success: true,
        message: 'Task deleted successfully.',
      };
    } catch (e) {
      console.error("Error deleting task: ", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      return {
        success: false,
        message: `Failed to delete task: ${errorMessage}`,
      };
    }
  }
);
