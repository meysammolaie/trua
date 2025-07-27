
'use server';

import { getPlatformAnalytics, PlatformAnalyticsData } from '@/ai/flows/get-platform-analytics-flow';

export async function getPlatformAnalyticsAction(): Promise<PlatformAnalyticsData> {
    return getPlatformAnalytics();
}
