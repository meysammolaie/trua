
'use server';

import { getLotteryData, LotteryData } from '@/ai/flows/get-lottery-data-flow';
import { runLotteryDraw, LotteryDrawOutput, LotteryDrawInput } from '@/ai/flows/lottery-flow';

export async function getLotteryDataAction(): Promise<LotteryData> {
    return getLotteryData();
}

export async function runLotteryDrawAction(input: LotteryDrawInput): Promise<LotteryDrawOutput> {
    return runLotteryDraw(input);
}
