
'use server';
/**
 * @fileOverview A flow for fetching referral data for a specific user.
 *
 * - getUserReferrals - Fetches referral code, stats, and a list of referred users.
 * - GetUserReferralsInput - Input for the flow.
 * - GetUserReferralsOutput - Output for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

const GetUserReferralsInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose referral data is being fetched.'),
});
export type GetUserReferralsInput = z.infer<typeof GetUserReferralsInputSchema>;

const ReferralDetailSchema = z.object({
  id: z.string(),
  referredUserName: z.string(),
  commissionAmount: z.number(),
  date: z.string(),
});
export type ReferralDetail = z.infer<typeof ReferralDetailSchema>;

const GetUserReferralsOutputSchema = z.object({
  referralCode: z.string(),
  stats: z.object({
    totalReferredUsers: z.number(),
    totalCommissionEarned: z.number(),
  }),
  referrals: z.array(ReferralDetailSchema),
});
export type GetUserReferralsOutput = z.infer<typeof GetUserReferralsOutputSchema>;


export async function getUserReferrals(input: GetUserReferralsInput): Promise<GetUserReferralsOutput> {
  return await getUserReferralsFlow(input);
}

const getUserReferralsFlow = ai.defineFlow(
  {
    name: 'getUserReferralsFlow',
    inputSchema: GetUserReferralsInputSchema,
    outputSchema: GetUserReferralsOutputSchema,
  },
  async ({ userId }) => {
    // 1. Fetch user's own data to get their referral code
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    const referralCode = userSnap.data().referralCode || '';

    // 2. Fetch all commissions where this user is the referrer (without server-side ordering)
    const commissionsRef = collection(db, 'commissions');
    const q = query(commissionsRef, where('referrerId', '==', userId));
    const commissionsSnapshot = await getDocs(q);
    
    // Manually sort the results in code
    const sortedDocs = commissionsSnapshot.docs.sort((a, b) => {
        const dateA = (a.data().createdAt as Timestamp).toMillis();
        const dateB = (b.data().createdAt as Timestamp).toMillis();
        return dateB - dateA; // Sort descending
    });


    // 3. Get a list of all referred user IDs to fetch their details
    const referredUserIds = sortedDocs.map(doc => doc.data().referredUserId);
    
    const usersMap = new Map<string, {fullName: string}>();
    if (referredUserIds.length > 0) {
        const usersRef = collection(db, 'users');
        // Firestore 'in' query can take up to 30 items
        const userDetailsQuery = query(usersRef, where('uid', 'in', referredUserIds));
        const userDetailsSnapshot = await getDocs(userDetailsQuery);
        userDetailsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            usersMap.set(doc.id, { fullName: `${data.firstName} ${data.lastName}`.trim() });
        });
    }

    // 4. Process commissions and calculate stats
    let totalCommissionEarned = 0;
    const referredUsersSet = new Set<string>();

    const referrals: ReferralDetail[] = sortedDocs.map(doc => {
      const commissionData = doc.data();
      const commissionAmount = commissionData.commissionAmount || 0;

      totalCommissionEarned += commissionAmount;
      referredUsersSet.add(commissionData.referredUserId);
      
      const referredUser = usersMap.get(commissionData.referredUserId);

      return {
        id: doc.id,
        referredUserName: referredUser?.fullName || 'کاربر نامشخص',
        commissionAmount: commissionAmount,
        date: (commissionData.createdAt as Timestamp).toDate().toLocaleDateString('fa-IR'),
      };
    });

    return {
      referralCode,
      stats: {
        totalReferredUsers: referredUsersSet.size,
        totalCommissionEarned,
      },
      referrals,
    };
  }
);
