const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Place a bid
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { itemId, amount, isAutoBid, maxAutoBid } = req.body;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'active') return res.status(400).json({ error: 'Auction has ended' });
    if (item.sellerId === req.userId) return res.status(400).json({ error: 'Cannot bid on your own item' });
    if (new Date(item.endTime) < new Date()) return res.status(400).json({ error: 'Auction has ended' });

    const currentHighest = item.bids[0]?.amount || item.startPrice;
    const minBid = currentHighest + (currentHighest * 0.01); // minimum 1% increment

    if (parseFloat(amount) < minBid) {
      return res.status(400).json({ error: `Minimum bid is ₹${minBid.toFixed(2)}` });
    }

    // Check for buy now
    if (item.buyNowPrice && parseFloat(amount) >= item.buyNowPrice) {
      const bid = await prisma.bid.create({
        data: { amount: item.buyNowPrice, bidderId: req.userId, itemId },
        include: { bidder: { select: { id: true, name: true, avatar: true } } }
      });

      await prisma.item.update({
        where: { id: itemId },
        data: { status: 'sold', currentPrice: item.buyNowPrice }
      });

      const io = req.app.get('io');
      io.to(`auction-${itemId}`).emit('auctionEnd', {
        itemId, winner: { id: req.userId, name: bid.bidder.name, amount: item.buyNowPrice }
      });

      await prisma.notification.create({
        data: {
          type: 'auction_won',
          message: `You bought "${item.title}" for ₹${item.buyNowPrice.toFixed(2)}!`,
          userId: req.userId, link: `/item/${itemId}`
        }
      });

      return res.status(201).json({ bid, buyNow: true });
    }

    const bid = await prisma.bid.create({
      data: {
        amount: parseFloat(amount),
        isAutoBid: isAutoBid || false,
        maxAutoBid: maxAutoBid ? parseFloat(maxAutoBid) : null,
        bidderId: req.userId,
        itemId
      },
      include: { bidder: { select: { id: true, name: true, avatar: true } } }
    });

    await prisma.item.update({
      where: { id: itemId },
      data: { currentPrice: parseFloat(amount) }
    });

    // Notify previous high bidder (outbid)
    const previousBidder = item.bids[0];
    if (previousBidder && previousBidder.bidderId !== req.userId) {
      await prisma.notification.create({
        data: {
          type: 'outbid',
          message: `You've been outbid on "${item.title}". New high bid: ₹${parseFloat(amount).toFixed(2)}`,
          userId: previousBidder.bidderId, link: `/item/${itemId}`
        }
      });
      const io = req.app.get('io');
      io.to(`user-${previousBidder.bidderId}`).emit('outbid', { itemId, amount: parseFloat(amount) });
    }

    // Handle auto-bidding from other bidders
    const autoBids = await prisma.bid.findMany({
      where: { itemId, isAutoBid: true, bidderId: { not: req.userId }, maxAutoBid: { gt: parseFloat(amount) } },
      orderBy: { maxAutoBid: 'desc' }, take: 1
    });

    if (autoBids.length > 0) {
      const auto = autoBids[0];
      const autoBidAmount = Math.min(auto.maxAutoBid, parseFloat(amount) * 1.01);

      const autoBidEntry = await prisma.bid.create({
        data: { amount: autoBidAmount, isAutoBid: true, maxAutoBid: auto.maxAutoBid, bidderId: auto.bidderId, itemId },
        include: { bidder: { select: { id: true, name: true, avatar: true } } }
      });

      await prisma.item.update({ where: { id: itemId }, data: { currentPrice: autoBidAmount } });

      const io = req.app.get('io');
      io.to(`auction-${itemId}`).emit('newBid', {
        bid: autoBidEntry, itemId, currentPrice: autoBidAmount
      });
    }

    const io = req.app.get('io');
    io.to(`auction-${itemId}`).emit('newBid', {
      bid, itemId, currentPrice: parseFloat(amount)
    });

    res.status(201).json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

// Get bids for an item
router.get('/item/:itemId', async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { itemId: req.params.itemId },
      orderBy: { amount: 'desc' },
      include: { bidder: { select: { id: true, name: true, avatar: true } } }
    });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Get user's bids
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { bidderId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          include: {
            seller: { select: { id: true, name: true } },
            _count: { select: { bids: true } }
          }
        }
      }
    });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

module.exports = router;
