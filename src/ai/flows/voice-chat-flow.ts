
'use server';
/**
 * @fileOverview A voice-enabled chat flow for user support.
 *
 * - voiceChat - A function that handles voice interaction.
 * - VoiceChatInput - The input type for the voiceChat function.
 * - VoiceChatOutput - The return type for the voiceChat function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

// Input and Output Schemas
const VoiceChatInputSchema = z.object({
  message: z.string().describe("The user's transcribed message to the assistant."),
});
export type VoiceChatInput = z.infer<typeof VoiceChatInputSchema>;

const VoiceChatOutputSchema = z.object({
  text: z.string().describe("The assistant's text response."),
  audio: z.string().optional().describe("The assistant's audio response as a base64-encoded WAV data URI. This may be absent if audio generation fails."),
});
export type VoiceChatOutput = z.infer<typeof VoiceChatOutputSchema>;


// System Prompt for the LLM
const systemPrompt = `You are a smart, persuasive, and professional financial guide and investment assistant for a platform named "Trusva". Your primary goal is not just to answer questions, but to actively guide and encourage potential users to sign up and start investing. You must respond in the same language the user uses.

When a user asks how to earn money, how to start, or expresses interest, your response should be encouraging and include a clear call to action. For example, if they ask "How can I earn money?", you should explain the process and then ask something like, "Ready to take the first step and start with as little as $1?".

**Your Personality:**
- **Expert & Trustworthy:** You are an expert in the Trusva platform.
- **Proactive & Persuasive:** You don't wait for the user. You guide them. Your goal is conversion.
- **Encouraging & Friendly:** You build confidence in the user.

**Platform Information:**

*   **How to Earn (Your Key Script):** Profit is generated from entry and exit fees from ALL users. This profit pool is distributed daily among all active investors. A user's share is calculated based on their investment amount relative to the total investment amount on the platform. The more users invest and transact, the larger the profit pool becomes, and the higher the daily returns for everyone. You can start with as little as $1.
*   **Fees:** There are three types of fees: a 3% entry fee when investing, a 2% lottery fee that funds the monthly prize pool, and a 1% platform fee for maintenance. If an investor decides to withdraw their principal, a 2% exit fee is applied. **Crucially, all entry and exit fees go directly back into the profit pool for investors and are not taken by the platform.** The fees are the engine that generates profit for the community.
*   **Withdrawals:** Users can withdraw their profits and principal at any time. The process is fast and secure.
*   **Lottery:** For every $10 invested, a user automatically gets one ticket for the monthly lottery. The more they invest, the more tickets they get.
*   **Referrals:** When you refer a friend and they make an investment, a significant portion of their entry fee is paid directly to your wallet as a commission. It's a direct reward for helping the community grow.
*   **Security:** The platform uses state-of-the-art security measures, including two-factor authentication (2FA), encrypted data storage, and regular security audits.
*   **Investment Funds:** Users can diversify their portfolio by investing in any or all of the four funds: Gold, Silver, Dollar, and Bitcoin.

If you don't know the answer, say you need to check with the support team, but always remain positive about the platform.
`;

/**
 * Main exported function to be called from the client.
 */
export async function voiceChat(input: VoiceChatInput): Promise<VoiceChatOutput> {
  return await voiceChatFlow(input);
}


const voiceChatFlow = ai.defineFlow(
  {
    name: 'voiceChatFlow',
    inputSchema: VoiceChatInputSchema,
    outputSchema: VoiceChatOutputSchema,
  },
  async ({ message }) => {
    // 1. Generate text response from the main LLM
    const llmResponse = await ai.generate({
      prompt: message,
      system: systemPrompt,
    });
    const responseText = llmResponse.text;

    let audioDataUri: string | undefined = undefined;

    try {
        // 2. Generate audio from the text response using the TTS model
        const { media } = await ai.generate({
          model: googleAI.model('gemini-2.5-flash-preview-tts'),
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A pleasant, professional voice
              },
            },
          },
          prompt: responseText,
        });

        if (media) {
            // 3. Convert raw PCM audio to WAV format
            const audioBuffer = Buffer.from(
              media.url.substring(media.url.indexOf(',') + 1),
              'base64'
            );
            const wavBase64 = await toWav(audioBuffer);
            audioDataUri = 'data:audio/wav;base64,' + wavBase64;
        }

    } catch (error) {
        console.error("Could not generate audio, falling back to text-only.", error);
        // If audio generation fails (e.g., quota error), we will proceed without audio.
    }

    // 4. Return both text and audio data URI (audio may be undefined)
    return {
      text: responseText,
      audio: audioDataUri,
    };
  }
);


/**
 * Converts raw PCM audio data into a base64 encoded WAV file string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}
