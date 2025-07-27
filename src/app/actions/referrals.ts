
'use server';

import { getUserReferrals, GetUserReferralsInput, GetUserReferralsOutput } from '@/ai/flows/get-user-referrals-flow';

export async function getUserReferralsAction(input: GetUserReferralsInput): Promise<GetUserReferralsOutput> {
    return getUserReferrals(input);
}
