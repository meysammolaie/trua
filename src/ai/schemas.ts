import { z } from 'genkit';

export const PlatformSettingsSchema = z.object({
  entryFee: z.coerce.number().min(0).max(100),
  lotteryFee: z.coerce.number().min(0).max(100),
  platformFee: z.coerce.number().min(0).max(100),
  exitFee: z.coerce.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  goldWalletAddress: z.string(),
  silverWalletAddress: z.string(),
  usdtWalletAddress: z.string(),
  bitcoinWalletAddress: z.string(),
});
export type PlatformSettings = z.infer<typeof PlatformSettingsSchema>;
