
'use server';

import { getAdminDashboardData, AdminDashboardData } from '@/ai/flows/get-admin-dashboard-data-flow';

export async function getAdminDashboardDataAction(): Promise<AdminDashboardData> {
    return getAdminDashboardData();
}
