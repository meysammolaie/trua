
'use server';

import { submitInvestment, InvestmentInput, InvestmentOutput } from '@/ai/flows/investment-flow';

export async function submitInvestmentAction(input: InvestmentInput): Promise<InvestmentOutput> {
    return submitInvestment(input);
}
