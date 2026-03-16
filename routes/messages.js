const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content, itemId } = req.body;
    if (receiverId === req.userId) return res.status(400).json({ error: 'Cannot message yourself' });

    const message = await prisma.message.create({
      data: { content, senderId: req.userId, receiverId, itemId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    const io = req.app.get('io');
    const conversationId = [req.userId, receiverId].sort().join('-');
    io.to(`chat-${conversationId}`).emit('newMessage', message);
    io.to(`user-${receiverId}`).emit('messageNotification', { from: message.sender.name, content: content.substring(0, 50) });

    await prisma.notification.create({
      data: {
        type: 'message',
        message: `New message from ${message.sender.name}`,
        userId: receiverId,
        link: `/messages/${req.userId}`
      }
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversations list
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Group by conversation partner
    const conversationsMap = {};
    for (const msg of messages) {
      const partnerId = msg.senderId === req.userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === req.userId ? msg.receiver : msg.sender;
      if (!conversationsMap[partnerId]) {
        const unreadCount = await prisma.message.count({
          where: { senderId: partnerId, receiverId: req.userId, read: false }
        });
        conversationsMap[partnerId] = {
          partner, lastMessage: msg, unreadCount
        };
      }
    }

    res.json(Object.values(conversationsMap));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages with a user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        item: { select: { id: true, title: true } }
      }
    });

    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: req.params.userId, receiverId: req.userId, read: false },
      data: { read: true }
    });

    const partner = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { id: true, name: true, avatar: true }
    });

    res.json({ messages, partner });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: { receiverId: req.userId, read: false }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
