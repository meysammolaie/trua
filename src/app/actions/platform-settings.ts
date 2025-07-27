
'use server';

import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from '@/ai/flows/platform-settings-flow';

export async function getPlatformSettingsAction(): Promise<PlatformSettings> {
    return getPlatformSettings();
}

export async function updatePlatformSettingsAction(settings: PlatformSettings): Promise<{success: boolean, message: string}> {
    return updatePlatformSettings(settings);
}
