
'use server';

import { getAllTransactions, GetAllTransactionsOutput } from '@/ai/flows/get-all-transactions-flow';

export async function getAllTransactionsAction(): Promise<GetAllTransactionsOutput> {
    return getAllTransactions();
}
