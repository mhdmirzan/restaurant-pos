import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayFilter = { saleDate: { $gte: startOfDay, $lte: endOfDay } };

    // Today's aggregate stats
    const todayStats = await Sale.aggregate([
      { $match: todayFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          billCount: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
        },
      },
    ]);

    const stats = todayStats[0] || { totalSales: 0, billCount: 0, totalItems: 0 };
    const averageBill = stats.billCount > 0 ? Math.round(stats.totalSales / stats.billCount) : 0;

    // Chart timeframe calculations
    // 1. Last 7 Days (Week)
    const weekBuckets: { [key: string]: { label: string; date: string; sales: number; bills: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      weekBuckets[key] = { label, date: key, sales: 0, bills: 0 };
    }

    // 2. Last 30 Days (Month)
    const monthBuckets: { [key: string]: { label: string; date: string; sales: number; bills: number } } = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      monthBuckets[key] = { label, date: key, sales: 0, bills: 0 };
    }

    // 3. Last 12 Months (Year)
    const yearBuckets: { [key: string]: { label: string; date: string; sales: number; bills: number } } = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      yearBuckets[key] = { label, date: key, sales: 0, bills: 0 };
    }

    // Query sales over the past 12 months for chart aggregation
    const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const pastYearSales = await Sale.find({
      saleDate: { $gte: oneYearAgo, $lte: endOfDay },
    })
      .select('saleDate grandTotal')
      .lean();

    for (const sale of pastYearSales) {
      if (!sale.saleDate) continue;
      const d = new Date(sale.saleDate);
      const dayKey = d.toISOString().slice(0, 10);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (weekBuckets[dayKey]) {
        weekBuckets[dayKey].sales += sale.grandTotal || 0;
        weekBuckets[dayKey].bills += 1;
      }
      if (monthBuckets[dayKey]) {
        monthBuckets[dayKey].sales += sale.grandTotal || 0;
        monthBuckets[dayKey].bills += 1;
      }
      if (yearBuckets[monthKey]) {
        yearBuckets[monthKey].sales += sale.grandTotal || 0;
        yearBuckets[monthKey].bills += 1;
      }
    }

    const salesChart = {
      week: Object.values(weekBuckets),
      month: Object.values(monthBuckets),
      year: Object.values(yearBuckets),
    };

    // Recent 50 sales (sorted by time descending)
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Top selling items (all-time, by quantity)
    const topItems = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemName',
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      todaySales: stats.totalSales,
      todayBills: stats.billCount,
      itemsSold: stats.totalItems,
      averageBill,
      recentSales,
      topItems,
      salesChart,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
