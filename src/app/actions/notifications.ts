
'use server';

import { createNotification, CreateNotificationInput, CreateNotificationOutput } from '@/ai/flows/create-notification-flow';
import { getUserNotifications, GetUserNotificationsInput, GetUserNotificationsOutput } from '@/ai/flows/get-user-notifications-flow';
import { markNotificationAsRead, MarkNotificationAsReadInput, MarkNotificationAsReadOutput } from '@/ai/flows/mark-notification-as-read-flow';

export async function createNotificationAction(input: CreateNotificationInput): Promise<CreateNotificationOutput> {
    return createNotification(input);
}

export async function getUserNotificationsAction(input: GetUserNotificationsInput): Promise<GetUserNotificationsOutput> {
    return getUserNotifications(input);
}

export async function markNotificationAsReadAction(input: MarkNotificationAsReadInput): Promise<MarkNotificationAsReadOutput> {
    return markNotificationAsRead(input);
}
