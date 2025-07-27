import { z } from 'genkit';

export const PlatformSettingsSchema = z.object({
  entryFee: z.coerce.number().min(0).max(100),
  lotteryFee: z.coerce.number().min(0).max(100),
  platformFee: z.coerce.number().min(0).max(100),
  exitFee: z.coerce.number().min(0).max(100),
  networkFee: z.coerce.number().min(0).default(1),
  maintenanceMode: z.boolean(),
  goldWalletAddress: z.string(),
  silverWalletAddress: z.string(),
  usdtWalletAddress: z.string(),
  bitcoinWalletAddress: z.string(),
  minWithdrawalAmount: z.coerce.number().min(0).default(10),
  withdrawalDay: z.enum(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']).default('saturday'),
});

export const GetInvestmentDetailsInputSchema = z.object({
  investmentId: z.string().describe('The ID of the investment to fetch.'),
});

export const GetInvestmentDetailsOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userFullName: z.string(),
  userEmail: z.string(),
  fundId: z.string(),
  fundName: z.string(),
  amount: z.number(),
  amountUSD: z.number(),
  transactionHash: z.string(),
  status: z.enum(['pending', 'active', 'completed', 'rejected']),
  createdAt: z.string(),
  rejectionReason: z.string().optional(),
});
