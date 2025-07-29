
'use server';

import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from '@/ai/flows/platform-settings-flow';
import { clearTestData } from '@/ai/flows/clear-test-data-flow';
import { z } from 'zod';

export async function getPlatformSettingsAction(): Promise<PlatformSettings> {
    return getPlatformSettings();
}

export async function updatePlatformSettingsAction(settings: PlatformSettings): Promise<{success: boolean, message: string}> {
    return updatePlatformSettings(settings);
}


const ClearTestDataOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export async function clearTestDataAction(): Promise<z.infer<typeof ClearTestDataOutputSchema>> {
    return clearTestData();
}
