import dayjs from 'dayjs';
import Member from '../models/Member.js';
import Settings from '../models/Settings.js';
import { createSuccessResponse } from '../utils/response.js';

export async function getDashboardSummary(req, res) {
  const settings =
    (await Settings.findOne()) ||
    (await Settings.create({}));

  const today = dayjs().startOf('day');
  const nearingExpiryLimit = today.add(settings.nearingExpiryDays, 'day').endOf('day');

  const [totalMembers, activeMembers, expiredMembers, nearingExpiryMembers, activeNowMembers] =
    await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ endDate: { $gte: today.toDate() } }),
      Member.countDocuments({ endDate: { $lt: today.toDate() } }),
      Member.countDocuments({
        endDate: {
          $gte: today.toDate(),
          $lte: nearingExpiryLimit.toDate(),
        },
      }),
      getActiveNowCount(today),
    ]);

  const revenue = await getRevenueSummary(today);
  const monthlyRevenueTrend = await getMonthlyRevenueTrend(today);
  const statusDistribution = {
    active: activeMembers,
    expired: expiredMembers,
  };

  res.json(
    createSuccessResponse({
      stats: {
        totalMembers,
        activeMembers,
        expiredMembers,
        nearingExpiryMembers,
        activeNowMembers,
      },
      revenue,
      charts: {
        monthlyRevenueTrend,
        statusDistribution,
      },
    })
  );
}

async function getActiveNowCount(today) {
  const currentTime = dayjs().format('HH:mm');
  const count = await Member.countDocuments({
    endDate: { $gte: today.toDate() },
    'slotSnapshot.startTime': { $lte: currentTime },
    'slotSnapshot.endTime': { $gt: currentTime },
  });
  return count;
}

async function getRevenueSummary(now) {
  const startOfMonth = now.startOf('month').toDate();
  const endOfMonth = now.endOf('month').toDate();
  const startOfYear = now.startOf('year').toDate();
  const endOfYear = now.endOf('year').toDate();

  // Quarter calculation
  const quarter = Math.floor(now.month() / 3) + 1;
  const firstQuarterMonth = (quarter - 1) * 3;
  const startOfQuarter = now.month(firstQuarterMonth).startOf('month').toDate();
  const endOfQuarter = now.month(firstQuarterMonth + 2).endOf('month').toDate();

  const [monthTotal, quarterTotal, yearTotal] = await Promise.all([
    sumFinalPriceBetween(startOfMonth, endOfMonth),
    sumFinalPriceBetween(startOfQuarter, endOfQuarter),
    sumFinalPriceBetween(startOfYear, endOfYear),
  ]);

  return {
    currentMonth: monthTotal,
    currentQuarter: quarterTotal,
    currentYear: yearTotal,
  };
}

async function sumFinalPriceBetween(start, end) {
  const result = await Member.aggregate([
    {
      $match: {
        fullyPaid: true,
        startDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$finalPrice' },
      },
    },
  ]);
  return result[0]?.total || 0;
}

async function getMonthlyRevenueTrend(now) {
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const m = now.subtract(i, 'month');
    const start = m.startOf('month').toDate();
    const end = m.endOf('month').toDate();
    const revenue = await sumFinalPriceBetween(start, end);
    months.push({
      month: m.format('YYYY-MM'),
      label: m.format('MMM YYYY'),
      revenue,
    });
  }
  return months;
}

