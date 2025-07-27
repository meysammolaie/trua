
'use server';

import { getFundDetails, FundDetails } from '@/ai/flows/get-fund-details-flow';

export async function getFundDetailsAction(): Promise<FundDetails> {
    return getFundDetails();
}
