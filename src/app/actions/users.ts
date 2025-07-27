
'use server';

import { getAllUsers, GetAllUsersOutput } from '@/ai/flows/get-all-users-flow';

export async function getAllUsersAction(): Promise<GetAllUsersOutput> {
    return getAllUsers();
}
