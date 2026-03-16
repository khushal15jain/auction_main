const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create payment (simulated Stripe)
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { itemId, shippingMethod, shippingAddress } = req.body;
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { shippingOptions: true, bids: { orderBy: { amount: 'desc' }, take: 1 } }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'sold') return res.status(400).json({ error: 'Item is not sold yet' });

    const winningBid = item.bids[0];
    if (!winningBid || winningBid.bidderId !== req.userId) {
      return res.status(403).json({ error: 'You did not win this auction' });
    }

    const shipping = item.shippingOptions.find(s => s.name === shippingMethod);
    const shippingCost = shipping ? shipping.price : 9.99;

    const payment = await prisma.payment.create({
      data: {
        amount: winningBid.amount + shippingCost,
        stripePaymentId: `pi_simulated_${Date.now()}`,
        status: 'completed',
        shippingMethod: shippingMethod || 'Standard',
        shippingCost,
        shippingAddress,
        buyerId: req.userId,
        itemId
      }
    });

    await prisma.notification.create({
      data: {
        type: 'payment',
        message: `Payment of ₹${payment.amount.toFixed(2)} received for "${item.title}"`,
        userId: item.sellerId, link: `/item/${itemId}`
      }
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// Get payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { buyerId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { item: { select: { id: true, title: true, images: true } } }
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;
