
'use server';

import { getWithdrawalRequests, GetAllWithdrawalsOutput } from '@/ai/flows/get-withdrawal-requests-flow';
import { updateWithdrawalStatus as updateWithdrawalStatusFlow, type UpdateWithdrawalStatusInput, type UpdateWithdrawalStatusOutput } from '@/ai/flows/update-withdrawal-status-flow';
import { createWithdrawalRequest as createWithdrawalRequestFlow, type createWithdrawalRequest } from '@/ai/flows/create-withdrawal-request-flow';
import { z } from 'zod';


export async function getWithdrawalRequestsAction(): Promise<GetAllWithdrawalsOutput> {
    return getWithdrawalRequests();
}

export async function updateWithdrawalStatusAction(input: UpdateWithdrawalStatusInput): Promise<UpdateWithdrawalStatusOutput> {
    return updateWithdrawalStatusFlow(input);
}

const CreateWithdrawalRequestInputSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  walletAddress: z.string(),
});
const CreateWithdrawalRequestOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export async function createWithdrawalRequestAction(input: z.infer<typeof CreateWithdrawalRequestInputSchema>): Promise<z.infer<typeof CreateWithdrawalRequestOutputSchema>> {
    return createWithdrawalRequestFlow(input);
}
