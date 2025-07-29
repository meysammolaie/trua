
'use server';
/**
 * @fileOverview A flow for fetching a user's recent login history.
 *
 * - getLoginHistory - Fetches the last 5 login records for a user.
 * - GetLoginHistoryInput - Input for the flow.
 * - GetLoginHistoryOutput - Output for the flow.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';

const ai = genkit({
  plugins: [googleAI()],
});

const GetLoginHistoryInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose login history is being fetched.'),
});
export type GetLoginHistoryInput = z.infer<typeof GetLoginHistoryInputSchema>;

const LoginHistoryRecordSchema = z.object({
  id: z.string(),
  device: z.string(),
  date: z.string(),
});
export type LoginHistoryRecord = z.infer<typeof LoginHistoryRecordSchema>;

const GetLoginHistoryOutputSchema = z.object({
  history: z.array(LoginHistoryRecordSchema),
});
export type GetLoginHistoryOutput = z.infer<typeof GetLoginHistoryOutputSchema>;

// A simple parser for User-Agent strings. Not exhaustive but covers common cases.
const parseUserAgent = (ua: string) => {
    if (!ua) return { os: 'Unknown OS', browser: 'Unknown Browser', device: 'Unknown Device' };

    let os = 'Unknown';
    let browser = 'Unknown';
    let device = 'Desktop';

    // OS detection
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/android/i.test(ua)) { os = 'Android'; device = 'Mobile'; }
    else if (/iphone|ipad|ipod/i.test(ua)) { os = 'iOS'; device = 'Mobile'; }
    else if (/linux/i.test(ua)) os = 'Linux';

    // Browser detection
    if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edg/i.test(ua)) browser = 'Edge';
    
    return { os, browser, device: `${device} - ${os}` };
};


export async function getLoginHistory(input: GetLoginHistoryInput): Promise<GetLoginHistoryOutput> {
  return await getLoginHistoryFlow(input);
}

const getLoginHistoryFlow = ai.defineFlow(
  {
    name: 'getLoginHistoryFlow',
    inputSchema: GetLoginHistoryInputSchema,
    outputSchema: GetLoginHistoryOutputSchema,
  },
  async ({ userId }) => {
    const historyRef = collection(db, 'login_history');
    // Query only by userId, which doesn't require a composite index
    const q = query(historyRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);

    // Sort the documents in code
    const sortedDocs = snapshot.docs.sort((a, b) => {
        const dateA = (a.data().timestamp as Timestamp).toMillis();
        const dateB = (b.data().timestamp as Timestamp).toMillis();
        return dateB - dateA; // Sort descending
    });
    
    // Take the last 5 after sorting
    const latestDocs = sortedDocs.slice(0, 5);
    
    const history = latestDocs.map(doc => {
        const data = doc.data();
        const parsedUA = parseUserAgent(data.userAgent || '');

        return {
            id: doc.id,
            device: parsedUA.device,
            date: (data.timestamp as Timestamp).toDate().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short'}),
        };
    });

    return { history };
  }
);
