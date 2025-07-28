
'use server';

import { submitInvestment, InvestmentInput, InvestmentOutput } from '@/ai/flows/investment-flow';
import { getInvestmentDetails, GetInvestmentDetailsInput, GetInvestmentDetailsOutput } from '@/ai/flows/get-investment-details-flow';
import { getAllInvestments, GetAllInvestmentsOutput } from '@/ai/flows/get-all-investments-flow';

export async function submitInvestmentAction(input: InvestmentInput): Promise<InvestmentOutput> {
    return submitInvestment(input);
}

export async function getInvestmentDetailsAction(input: GetInvestmentDetailsInput): Promise<GetInvestmentDetailsOutput> {
    return getInvestmentDetails(input);
}

export async function getAllInvestmentsAction(): Promise<GetAllInvestmentsOutput> {
    return getAllInvestments();
}
