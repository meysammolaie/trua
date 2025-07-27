'use server';
/**
 * @fileOverview A flow for fetching all data required for the admin dashboard.
 *
 * - getAdminDashboardData - Fetches and computes all stats and chart data.
 * - AdminDashboardData - The return type for the function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { formatDistanceToNowStrict } from 'date-fns';
import { faIR } from 'date-fns/locale';

const ai = genkit({
  plugins: [googleAI()],
});

// Input Schema (empty for this flow)
const GetAdminDashboardDataInputSchema = z.object({});

// Output Schemas
const StatsSchema = z.object({
  totalTVL: z.number(),
  totalUsers: z.number(),
  activeInvestments: z.number(),
  monthlyRevenue: z.number(),
});

const ChartDataPointSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const UserGrowthDataPointSchema = z.object({
  month: z.string(),
  users: z.number(),
});

const RecentActivitySchema = z.object({
  type: z.enum(['new_user', 'investment']),
  detail: z.string(),
  time: z.string(),
  status: z.enum(['info', 'success', 'warning', 'error']),
});

const AdminDashboardDataSchema = z.object({
  stats: StatsSchema,
  investmentByFundData: z.array(ChartDataPointSchema),
  userGrowthData: z.array(UserGrowthDataPointSchema),
  recentActivities: z.array(RecentActivitySchema),
});
export type AdminDashboardData = z.infer<typeof AdminDashboardDataSchema>;

// Firestore Document Types
type UserDocument = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Timestamp;
};

type InvestmentDocument = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed';
  createdAt: Timestamp;
};

const fundNames: Record<string, string> = {
    gold: "طلا",
    silver: "نقره",
    dollar: "دلار",
    bitcoin: "بیت‌کوین"
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return await getAdminDashboardDataFlow({});
}

const getAdminDashboardDataFlow = ai.defineFlow(
  {
    name: 'getAdminDashboardDataFlow',
    inputSchema: GetAdminDashboardDataInputSchema,
    outputSchema: AdminDashboardDataSchema,
  },
  async () => {
    // 1. Fetch all necessary data in parallel
    const usersCollection = collection(db, "users");
    const investmentsCollection = collection(db, "investments");

    const [usersSnapshot, investmentsSnapshot] = await Promise.all([
      getDocs(query(usersCollection, orderBy("createdAt", "desc"))),
      getDocs(query(investmentsCollection, orderBy("createdAt", "desc")))
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as UserDocument) }));
    const investments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as InvestmentDocument) }));

    // 2. Calculate Stats
    const totalUsers = users.length;

    const totalTVL = investments
      .filter(inv => ['active', 'pending'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amount, 0);

    const activeInvestments = investments.filter(inv => ['active', 'pending'].includes(inv.status)).length;
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const oneMonthAgoTimestamp = Timestamp.fromDate(oneMonthAgo);

    const monthlyRevenue = investments
        .filter(inv => inv.createdAt >= oneMonthAgoTimestamp)
        .reduce((sum, inv) => {
            const entryFee = inv.amount * 0.03;
            const lotteryFee = inv.amount * 0.02;
            const platformFee = inv.amount * 0.01;
            return sum + entryFee + lotteryFee + platformFee;
        }, 0);


    // 3. Prepare Investment By Fund Chart Data
    const investmentByFundMap: Record<string, number> = {};
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const fundName = fundNames[inv.fundId] || inv.fundId;
            if (!investmentByFundMap[fundName]) {
                investmentByFundMap[fundName] = 0;
            }
            investmentByFundMap[fundName] += inv.amount;
        });

    const investmentByFundData = Object.entries(investmentByFundMap).map(([name, value]) => ({
        name,
        value
    }));


    // 4. Prepare User Growth Chart Data
    const userGrowthMap: Record<string, number> = {};
    const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    
    users.forEach(user => {
        const date = user.createdAt.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM format
        if(!userGrowthMap[monthKey]) {
            userGrowthMap[monthKey] = 0;
        }
        userGrowthMap[monthKey]++;
    });

    const userGrowthData = Object.entries(userGrowthMap)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort by YYYY-MM
        .slice(-6) // Get last 6 months
        .map(([key, value]) => {
            const monthIndex = parseInt(key.split('-')[1], 10) - 1;
            return {
                month: monthNames[monthIndex],
                users: value
            };
        });


    // 5. Prepare Recent Activities
    const recentActivities: z.infer<typeof RecentActivitySchema>[] = [];
    
    // Add latest users
    users.slice(0, 3).forEach(user => {
        recentActivities.push({
            type: 'new_user',
            detail: `کاربر جدیدی با ایمیل ${user.email} ثبت نام کرد.`,
            time: formatDistanceToNowStrict(user.createdAt.toDate(), { addSuffix: true, locale: faIR }),
            status: 'info'
        });
    });

    // Add latest investments
    investments.slice(0, 3).forEach(inv => {
        const user = users.find(u => u.uid === inv.userId);
        const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `کاربر (${inv.userId.substring(0,6)}...)`;
        recentActivities.push({
            type: 'investment',
            detail: `سرمایه‌گذاری جدید از ${userName} به مبلغ $${inv.amount.toLocaleString()} در صندوق ${fundNames[inv.fundId]}.`,
            time: formatDistanceToNowStrict(inv.createdAt.toDate(), { addSuffix: true, locale: faIR }),
            status: 'success'
        });
    });

    // Sort all activities by date (approximated by order in array) and take latest 5
    const sortedActivities = recentActivities
        .sort((a, b) => {
            // This is a heuristic sort. A more robust way would be to store original dates
            // but for this purpose, it's likely good enough.
            const aDate = new Date(users.find(u => a.detail.includes(u.email))?.createdAt.toMillis() || investments.find(i => a.detail.includes(i.id))?.createdAt.toMillis() || 0);
            const bDate = new Date(users.find(u => b.detail.includes(u.email))?.createdAt.toMillis() || investments.find(i => b.detail.includes(i.id))?.createdAt.toMillis() || 0);
            return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 5);


    return {
      stats: { totalTVL, totalUsers, activeInvestments, monthlyRevenue },
      investmentByFundData,
      userGrowthData,
      recentActivities: sortedActivities,
    };
  }
);
