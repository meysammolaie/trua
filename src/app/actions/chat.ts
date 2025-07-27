
'use server';

import { voiceChat, VoiceChatInput, VoiceChatOutput } from '@/ai/flows/voice-chat-flow';

export async function voiceChatAction(input: VoiceChatInput): Promise<VoiceChatOutput> {
    return voiceChat(input);
}
