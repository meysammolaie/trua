
'use server';

import { getLoginHistory, GetLoginHistoryInput, GetLoginHistoryOutput } from '@/ai/flows/get-login-history-flow';

export async function getLoginHistoryAction(input: GetLoginHistoryInput): Promise<GetLoginHistoryOutput> {
    return getLoginHistory(input);
}
