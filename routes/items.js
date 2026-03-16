const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads/items')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create item
router.post('/', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, condition, startPrice, buyNowPrice, auctionType, endTime, categoryId, location } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/items/${f.filename}`) : [];

    const item = await prisma.item.create({
      data: {
        title, description,
        images: JSON.stringify(images),
        condition: condition || 'used',
        startPrice: parseFloat(startPrice),
        currentPrice: parseFloat(startPrice),
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
        auctionType: auctionType || 'english',
        endTime: new Date(endTime),
        sellerId: req.userId,
        categoryId,
        location
      },
      include: { seller: { select: { id: true, name: true, avatar: true } }, category: true }
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Get all items (paginated, with filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, category, condition, minPrice, maxPrice, sort, status = 'active', sellerId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (condition) where.condition = condition;
    if (sellerId) where.sellerId = sellerId;
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

    res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, name: true, avatar: true, bio: true, location: true, createdAt: true } },
        category: true,
        bids: {
          orderBy: { amount: 'desc' }, take: 10,
          include: { bidder: { select: { id: true, name: true, avatar: true } } }
        },
        ratings: {
          orderBy: { createdAt: 'desc' },
          include: { rater: { select: { id: true, name: true, avatar: true } } }
        },
        shippingOptions: true,
        _count: { select: { bids: true, watchlist: true } }
      }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });

    // increment views
    await prisma.item.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });

    let isWatched = false;
    if (req.userId) {
      const w = await prisma.watchlist.findUnique({ where: { userId_itemId: { userId: req.userId, itemId: req.params.id } } });
      isWatched = !!w;
    }

    res.json({ ...item, isWatched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Update item
router.put('/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.sellerId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    const { title, description, condition, startPrice, buyNowPrice, endTime, categoryId, location } = req.body;
    const data = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (condition) data.condition = condition;
    if (startPrice) data.startPrice = parseFloat(startPrice);
    if (buyNowPrice) data.buyNowPrice = parseFloat(buyNowPrice);
    if (endTime) data.endTime = new Date(endTime);
    if (categoryId) data.categoryId = categoryId;
    if (location !== undefined) data.location = location;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/items/${f.filename}`);
      const existing = JSON.parse(item.images || '[]');
      data.images = JSON.stringify([...existing, ...newImages]);
    }

    const updated = await prisma.item.update({
      where: { id: req.params.id }, data,
      include: { seller: { select: { id: true, name: true, avatar: true } }, category: true }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.sellerId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
