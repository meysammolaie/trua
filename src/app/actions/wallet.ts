
'use server';

import { getUserWallet, GetUserWalletInput, GetUserWalletOutput } from '@/ai/flows/get-user-wallet-flow';

export async function getUserWalletAction(input: GetUserWalletInput): Promise<GetUserWalletOutput> {
    return getUserWallet(input);
}
