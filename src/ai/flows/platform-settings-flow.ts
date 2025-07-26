
'use server';
/**
 * @fileOverview Flows for managing platform-wide settings.
 *
 * - getPlatformSettings - Fetches the current platform settings.
 * - updatePlatformSettings - Saves new platform settings.
 * - PlatformSettings - The type for the settings object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC_ID = 'main_settings';
const SETTINGS_COLLECTION = 'platform_settings';

const PlatformSettingsSchema = z.object({
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

const UpdatePlatformSettingsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/**
 * Fetches the current platform settings from Firestore.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
    return await getPlatformSettingsFlow({});
}

const getPlatformSettingsFlow = ai.defineFlow(
  {
    name: 'getPlatformSettingsFlow',
    inputSchema: z.object({}),
    outputSchema: PlatformSettingsSchema,
  },
  async () => {
    try {
      const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        // Validate data with Zod schema
        return PlatformSettingsSchema.parse(docSnap.data());
      } else {
        // Return default values if no settings are found
        console.warn("No platform settings document found, returning defaults.");
        return {
            entryFee: 3,
            lotteryFee: 2,
            platformFee: 1,
            exitFee: 2,
            maintenanceMode: false,
            goldWalletAddress: "",
            silverWalletAddress: "",
            usdtWalletAddress: "",
            bitcoinWalletAddress: "",
        };
      }
    } catch (error) {
      console.error("Error fetching platform settings: ", error);
      throw new Error(`Failed to fetch platform settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);


/**
 * Updates the platform settings in Firestore.
 */
export async function updatePlatformSettings(input: PlatformSettings): Promise<z.infer<typeof UpdatePlatformSettingsOutputSchema>> {
    return await updatePlatformSettingsFlow(input);
}

const updatePlatformSettingsFlow = ai.defineFlow(
  {
    name: 'updatePlatformSettingsFlow',
    inputSchema: PlatformSettingsSchema,
    outputSchema: UpdatePlatformSettingsOutputSchema,
  },
  async (settings) => {
    try {
      const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      // Use setDoc with merge: true to create or update the document
      await setDoc(settingsRef, settings, { merge: true });
      
      return {
        success: true,
        message: 'Platform settings updated successfully.',
      };
    } catch (error) {
      console.error("Error updating platform settings: ", error);
      return {
        success: false,
        message: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
);
