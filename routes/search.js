const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, category, condition, minPrice, maxPrice, sort, page = 1, limit = 12, auctionType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'active' };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } }
      ];
    }
    if (category) where.categoryId = category;
    if (condition) where.condition = condition;
    if (auctionType) where.auctionType = auctionType;
    if (minPrice || maxPrice) {
      where.currentPrice = {};
      if (minPrice) where.currentPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.currentPrice.lte = parseFloat(maxPrice);
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { currentPrice: 'asc' };
    else if (sort === 'price_desc') orderBy = { currentPrice: 'desc' };
    else if (sort === 'ending_soon') orderBy = { endTime: 'asc' };
    else if (sort === 'most_bids') orderBy = { bids: { _count: 'desc' } };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where, skip, take: parseInt(limit), orderBy,
        include: {
          seller: { select: { id: true, name: true, avatar: true } },
          category: true,
          _count: { select: { bids: true, watchlist: true } }
        }
      }),
      prisma.item.count({ where })
    ]);

    // Get categories for filter sidebar
    const categories = await prisma.category.findMany({
      include: { _count: { select: { items: { where: { status: 'active' } } } } }
    });

    res.json({
      items, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Autocomplete suggestions
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const items = await prisma.item.findMany({
      where: {
        status: 'active',
        OR: [{ title: { contains: q } }]
      },
      select: { id: true, title: true, currentPrice: true },
      take: 5
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Suggestions failed' });
  }
});

module.exports = router;
