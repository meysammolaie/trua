
'use server';

import { getUserDetails, GetUserDetailsInput, GetUserDetailsOutput } from '@/ai/flows/get-user-details-flow';

export async function getUserDetailsAction(input: GetUserDetailsInput): Promise<GetUserDetailsOutput> {
    return getUserDetails(input);
}
