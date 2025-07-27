
'use server';

import { updateInvestmentStatus } from '@/ai/flows/update-investment-status-flow';
import type { UpdateInvestmentStatusInput, UpdateInvestmentStatusOutput } from '@/ai/flows/update-investment-status-flow';


export async function updateInvestmentStatusAction(input: UpdateInvestmentStatusInput): Promise<UpdateInvestmentStatusOutput> {
    return updateInvestmentStatus(input);
}
