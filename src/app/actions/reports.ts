
'use server';

import { distributeProfits } from '@/ai/flows/distribute-profits-flow';
import { z } from 'zod';

const DistributeProfitsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  distributedAmount: z.number().optional(),
  investorCount: z.number().optional(),
});


export async function distributeProfitsAction(): Promise<z.infer<typeof DistributeProfitsOutputSchema>> {
    return distributeProfits();
}
