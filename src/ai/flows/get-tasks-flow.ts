
'use server';
/**
 * @fileOverview A flow for fetching all active tasks.
 */

import { genkit } from 'genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const ai = genkit({
  plugins: [],
});

const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  rewardAmount: z.number(),
  rewardType: z.enum(["usd", "gold"]),
  createdAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

const GetTasksOutputSchema = z.array(TaskSchema);
export type GetTasksOutput = z.infer<typeof GetTasksOutputSchema>;

export async function getTasks(): Promise<GetTasksOutput> {
  return await getTasksFlow({});
}

const getTasksFlow = ai.defineFlow(
  {
    name: 'getTasksFlow',
    inputSchema: z.object({}),
    outputSchema: GetTasksOutputSchema,
  },
  async () => {
    try {
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          rewardAmount: data.rewardAmount,
          rewardType: data.rewardType,
          createdAt: (data.createdAt as Timestamp).toDate().toLocaleDateString('en-US'),
        };
      });

      return tasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  }
);
