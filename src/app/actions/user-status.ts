
'use server';

import { updateUserStatus, UpdateUserStatusInput, UpdateUserStatusOutput } from '@/ai/flows/update-user-status-flow';

export async function updateUserStatusAction(input: UpdateUserStatusInput): Promise<UpdateUserStatusOutput> {
    return updateUserStatus(input);
}
