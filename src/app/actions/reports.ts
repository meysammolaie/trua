
'use server';

import { distributeProfits } from '@/ai/flows/distribute-profits-flow';
import { unlockBonuses } from '@/ai/flows/unlock-bonuses-flow';
import { z } from 'zod';

const DistributeProfitsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  distributedAmount: z.number().optional(),
  investorCount: z.number().optional(),
});

const UnlockBonusesOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  unlockedCount: z.number(),
});


export async function distributeProfitsAction(): Promise<z.infer<typeof DistributeProfitsOutputSchema>> {
    return distributeProfits();
}

export async function unlockBonusesAction(): Promise<z.infer<typeof UnlockBonusesOutputSchema>> {
    return unlockBonuses();
}
