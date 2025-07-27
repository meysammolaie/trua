
'use server';
/**
 * @fileOverview A flow for fetching a user's recent login history.
 *
 * - getLoginHistory - Fetches the last 5 login records for a user.
 * - GetLoginHistoryInput - Input for the flow.
 * - GetLoginHistoryOutput - Output for the flow.
 */

import { ai } from '@/lib/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';

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
    if (!ua) return { os: 'سیستم‌عامل نامشخص', browser: 'مرورگر نامشخص', device: 'دستگاه نامشخص' };

    let os = 'نامشخص';
    let browser = 'نامشخص';
    let device = 'دسکتاپ';

    // OS detection
    if (/windows/i.test(ua)) os = 'ویندوز';
    else if (/macintosh|mac os x/i.test(ua)) os = 'مک';
    else if (/android/i.test(ua)) { os = 'اندروید'; device = 'موبایل'; }
    else if (/iphone|ipad|ipod/i.test(ua)) { os = 'iOS'; device = 'موبایل'; }
    else if (/linux/i.test(ua)) os = 'لینوکس';

    // Browser detection
    if (/chrome|crios/i.test(ua)) browser = 'کروم';
    else if (/firefox|fxios/i.test(ua)) browser = 'فایرفاکس';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'سافاری';
    else if (/edg/i.test(ua)) browser = 'اج';
    
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
            date: (data.timestamp as Timestamp).toDate().toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short'}),
        };
    });

    return { history };
  }
);
