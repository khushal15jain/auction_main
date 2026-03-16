const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create a rating
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ratedUserId, itemId, score, comment } = req.body;
    if (ratedUserId === req.userId) return res.status(400).json({ error: 'Cannot rate yourself' });
    if (score < 1 || score > 5) return res.status(400).json({ error: 'Score must be 1-5' });

    // Check if already rated
    const existing = await prisma.rating.findFirst({
      where: { raterId: req.userId, ratedUserId, itemId }
    });
    if (existing) return res.status(400).json({ error: 'Already rated' });

    const rating = await prisma.rating.create({
      data: { score: parseInt(score), comment, raterId: req.userId, ratedUserId, itemId },
      include: { rater: { select: { id: true, name: true, avatar: true } } }
    });

    await prisma.notification.create({
      data: {
        type: 'rating',
        message: `${rating.rater.name} left you a ${score}-star review`,
        userId: ratedUserId,
        link: `/profile/${ratedUserId}`
      }
    });

    res.status(201).json(rating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { ratedUserId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        rater: { select: { id: true, name: true, avatar: true } },
        item: { select: { id: true, title: true } }
      }
    });

    const avg = await prisma.rating.aggregate({
      where: { ratedUserId: req.params.userId },
      _avg: { score: true },
      _count: { score: true }
    });

    res.json({ ratings, average: avg._avg.score || 0, count: avg._count.score });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get ratings for an item
router.get('/item/:itemId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { itemId: req.params.itemId },
      orderBy: { createdAt: 'desc' },
      include: { rater: { select: { id: true, name: true, avatar: true } } }
    });

    const avg = await prisma.rating.aggregate({
      where: { itemId: req.params.itemId },
      _avg: { score: true },
      _count: { score: true }
    });

    res.json({ ratings, average: avg._avg.score || 0, count: avg._count.score });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
