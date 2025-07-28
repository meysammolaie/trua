
'use server';

import { createTask, CreateTaskInput, CreateTaskOutput } from '@/ai/flows/create-task-flow';
import { getTasks, GetTasksOutput, Task } from '@/ai/flows/get-tasks-flow';
import { deleteTask, DeleteTaskInput, DeleteTaskOutput } from '@/ai/flows/delete-task-flow';

export type { Task };

export async function createTaskAction(input: CreateTaskInput): Promise<CreateTaskOutput> {
    return createTask(input);
}

export async function getTasksAction(): Promise<GetTasksOutput> {
    return getTasks();
}

export async function deleteTaskAction(input: DeleteTaskInput): Promise<DeleteTaskOutput> {
    return deleteTask(input);
}
