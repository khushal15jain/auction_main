require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Make io & prisma available to routes
app.set('io', io);
app.set('prisma', prisma);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/search', require('./routes/search'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/watchlist', require('./routes/watchlist'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinAuction', (itemId) => {
    socket.join(`auction-${itemId}`);
  });

  socket.on('leaveAuction', (itemId) => {
    socket.leave(`auction-${itemId}`);
  });

  socket.on('joinChat', (conversationId) => {
    socket.join(`chat-${conversationId}`);
  });

  socket.on('joinUser', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Auction timer — check for ended auctions every 10s
setInterval(async () => {
  try {
    const endedItems = await prisma.item.findMany({
      where: {
        status: 'active',
        endTime: { lte: new Date() }
      },
      include: {
        bids: { orderBy: { amount: 'desc' }, take: 1, include: { bidder: true } }
      }
    });

    for (const item of endedItems) {
      const winner = item.bids[0];
      await prisma.item.update({
        where: { id: item.id },
        data: {
          status: winner ? 'sold' : 'expired',
          currentPrice: winner ? winner.amount : item.currentPrice
        }
      });

      if (winner) {
        await prisma.notification.create({
          data: {
            type: 'auction_won',
            message: `Congratulations! You won the auction for "${item.title}" at ₹${winner.amount.toFixed(2)}!`,
            userId: winner.bidderId,
            link: `/item/${item.id}`
          }
        });
        io.to(`user-${winner.bidderId}`).emit('auctionWon', { itemId: item.id, amount: winner.amount });
      }

      io.to(`auction-${item.id}`).emit('auctionEnd', {
        itemId: item.id,
        winner: winner ? { id: winner.bidderId, name: winner.bidder.name, amount: winner.amount } : null
      });
    }
  } catch (err) {
    // silently continue
  }
}, 10000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Auction Platform running on http://localhost:${PORT}`);
});
