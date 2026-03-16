const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Seller analytics
router.get('/seller', authMiddleware, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { sellerId: req.userId },
      include: { bids: true, payments: true, _count: { select: { bids: true, watchlist: true } } }
    });

    const totalListings = items.length;
    const activeListings = items.filter(i => i.status === 'active').length;
    const soldItems = items.filter(i => i.status === 'sold').length;
    const totalViews = items.reduce((sum, i) => sum + i.views, 0);
    const totalBids = items.reduce((sum, i) => sum + i._count.bids, 0);
    const totalRevenue = items.reduce((sum, i) => {
      const payments = i.payments.filter(p => p.status === 'completed');
      return sum + payments.reduce((s, p) => s + p.amount, 0);
    }, 0);
    const totalWatchers = items.reduce((sum, i) => sum + i._count.watchlist, 0);

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentPayments = await prisma.payment.findMany({
      where: { item: { sellerId: req.userId }, status: 'completed', createdAt: { gte: sixMonthsAgo } },
      orderBy: { createdAt: 'asc' }
    });

    const revenueByMonth = {};
    for (const p of recentPayments) {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + p.amount;
    }

    // Top items
    const topItems = items
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(i => ({ id: i.id, title: i.title, views: i.views, bids: i._count.bids }));

    res.json({
      totalListings, activeListings, soldItems, totalViews, totalBids,
      totalRevenue, totalWatchers, revenueByMonth, topItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Platform analytics (public)
router.get('/platform', async (req, res) => {
  try {
    const [totalUsers, totalItems, totalBids, activeAuctions] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.bid.count(),
      prisma.item.count({ where: { status: 'active' } })
    ]);

    const recentItems = await prisma.item.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, title: true, currentPrice: true, createdAt: true }
    });

    res.json({ totalUsers, totalItems, totalBids, activeAuctions, recentItems });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
