
'use server';

import { getCommissions, GetAllCommissionsOutput } from '@/ai/flows/get-commissions-flow';

export async function getCommissionsAction(): Promise<GetAllCommissionsOutput> {
    return getCommissions();
}
