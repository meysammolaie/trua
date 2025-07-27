
'use server';
/**
 * @fileOverview Flows for managing platform-wide settings.
 *
 * - getPlatformSettings - Fetches the current platform settings.
 * - updatePlatformSettings - Saves new platform settings.
 * - PlatformSettings - The type for the settings object.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PlatformSettingsSchema } from '@/ai/schemas';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export type PlatformSettings = z.infer<typeof PlatformSettingsSchema>;

const SETTINGS_DOC_ID = 'main_settings';
const SETTINGS_COLLECTION = 'platform_settings';


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
            networkFee: 1,
            maintenanceMode: false,
            goldWalletAddress: "0xA1bDa01cd7c599a734615026A355bd80a4ae6f48",
            silverWalletAddress: "0xA1bDa01cd7c599a734615026A355bd80a4ae6f48",
            usdtWalletAddress: "0xA1bDa01cd7c599a734615026A355bd80a4ae6f48",
            bitcoinWalletAddress: "0xA1bDa01cd7c599a734615026A355bd80a4ae6f48",
            minWithdrawalAmount: 10,
            withdrawalDay: 'saturday',
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
