const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Toggle watchlist
router.post('/toggle', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.body;
    const existing = await prisma.watchlist.findUnique({
      where: { userId_itemId: { userId: req.userId, itemId } }
    });

    if (existing) {
      await prisma.watchlist.delete({ where: { id: existing.id } });
      return res.json({ watched: false });
    }

    await prisma.watchlist.create({ data: { userId: req.userId, itemId } });
    res.json({ watched: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle watchlist' });
  }
});

// Get user's watchlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: req.userId },
      include: {
        item: {
          include: {
            seller: { select: { id: true, name: true } },
            category: true,
            _count: { select: { bids: true } }
          }
        }
      }
    });
    res.json(watchlist.map(w => w.item));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

module.exports = router;
