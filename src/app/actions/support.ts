
'use server';

import { createTicket, CreateTicketInput, CreateTicketOutput } from '@/ai/flows/create-ticket-flow';
import { addTicketReply, AddTicketReplyInput, AddTicketReplyOutput } from '@/ai/flows/add-ticket-reply-flow';
import { getUserTickets, GetUserTicketsInput, GetUserTicketsOutput } from '@/ai/flows/get-user-tickets-flow';
import { getAdminTickets, GetAdminTicketsOutput } from '@/ai/flows/get-admin-tickets-flow';
import { getTicketDetails, GetTicketDetailsInput, GetTicketDetailsOutput } from '@/ai/flows/get-ticket-details-flow';
import { updateTicketStatus, UpdateTicketStatusInput, UpdateTicketStatusOutput } from '@/ai/flows/update-ticket-status-flow';

export async function createTicketAction(input: CreateTicketInput): Promise<CreateTicketOutput> {
    return createTicket(input);
}

export async function addTicketReplyAction(input: AddTicketReplyInput): Promise<AddTicketReplyOutput> {
    return addTicketReply(input);
}

export async function getUserTicketsAction(input: GetUserTicketsInput): Promise<GetUserTicketsOutput> {
    return getUserTickets(input);
}

export async function getAdminTicketsAction(): Promise<GetAdminTicketsOutput> {
    return getAdminTickets();
}

export async function getTicketDetailsAction(input: GetTicketDetailsInput): Promise<GetTicketDetailsOutput> {
    return getTicketDetails(input);
}

export async function updateTicketStatusAction(input: UpdateTicketStatusInput): Promise<UpdateTicketStatusOutput> {
    return updateTicketStatus(input);
}
