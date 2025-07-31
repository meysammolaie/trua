import { z } from 'zod';

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
  bonusUnlockTarget: z.coerce.number().positive().default(50000000), // New field for bonus unlock
  automaticProfitDistribution: z.boolean().default(true),
  lastDistributionAt: z.string().nullable().optional(),
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

export const UpdateInvestmentStatusInputSchema = z.object({
  investmentId: z.string().describe('The ID of the investment to update.'),
  newStatus: z.enum(['active', 'rejected', 'completed']).describe('The new status for the investment.'),
  rejectionReason: z.string().optional().describe('The reason for rejecting the investment.'),
});

export const UpdateInvestmentStatusOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// User Details Schemas
export const GetUserDetailsInputSchema = z.object({
  userId: z.string(),
});

export const UserProfileSchema = z.object({
  uid: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  status: z.enum(['active', 'blocked']),
});

export const TransactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  fund: z.string(),
  status: z.string(),
  date: z.string(),
  amount: z.number(),
  proof: z.string().optional(),
});

export const StatsSchema = z.object({
  activeInvestment: z.number(),
  walletBalance: z.number(), 
  totalProfit: z.number(),
  lockedBonus: z.number(),
  lotteryTickets: z.number(),
});

export const ChartDataPointSchema = z.object({
  month: z.string(),
  investment: z.number(),
});

export const GetUserDetailsOutputSchema = z.object({
  profile: UserProfileSchema,
  transactions: z.array(TransactionSchema),
  stats: StatsSchema,
  investmentChartData: z.array(ChartDataPointSchema),
});


export const GetUserWalletInputSchema = z.object({
  userId: z.string(),
});

export const AssetSchema = z.object({
  fund: z.string(),
  value: z.number(),
});

export const GetUserWalletOutputSchema = z.object({
  assets: z.array(AssetSchema),
  recentTransactions: z.array(TransactionSchema),
  totalAssetValue: z.number(),
  walletBalance: z.number(), 
  lockedBonus: z.number(),
});
