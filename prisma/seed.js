const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electronics', slug: 'electronics', icon: '💻' } }),
    prisma.category.create({ data: { name: 'Fashion', slug: 'fashion', icon: '👗' } }),
    prisma.category.create({ data: { name: 'Home & Garden', slug: 'home-garden', icon: '🏡' } }),
    prisma.category.create({ data: { name: 'Vehicles', slug: 'vehicles', icon: '🚗' } }),
    prisma.category.create({ data: { name: 'Art & Collectibles', slug: 'art-collectibles', icon: '🎨' } }),
    prisma.category.create({ data: { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽' } }),
    prisma.category.create({ data: { name: 'Books & Media', slug: 'books-media', icon: '📚' } }),
    prisma.category.create({ data: { name: 'Jewelry & Watches', slug: 'jewelry-watches', icon: '💎' } }),
    prisma.category.create({ data: { name: 'Toys & Hobbies', slug: 'toys-hobbies', icon: '🎮' } }),
    prisma.category.create({ data: { name: 'Musical Instruments', slug: 'musical-instruments', icon: '🎸' } })
  ]);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com', name: 'Alice Johnson', password: hashedPassword,
        bio: 'Passionate collector of vintage electronics and rare books.', location: 'New York, NY'
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com', name: 'Bob Smith', password: hashedPassword,
        bio: 'Professional art dealer with 10 years of experience.', location: 'Los Angeles, CA'
      }
    }),
    prisma.user.create({
      data: {
        email: 'carol@example.com', name: 'Carol Davis', password: hashedPassword,
        bio: 'Sports memorabilia enthusiast and weekend musician.', location: 'Chicago, IL'
      }
    }),
    prisma.user.create({
      data: {
        email: 'demo@example.com', name: 'Demo User', password: hashedPassword,
        bio: 'Exploring the auction world!', location: 'San Francisco, CA'
      }
    })
  ]);

  // Create items
  const futureDate = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const items = [
    {
      title: 'Vintage 1960s Gibson Les Paul Guitar',
      description: 'Authentic 1960s Gibson Les Paul in excellent condition. Original pickups, hardware, and case included. A true collector\'s dream with incredible tone and sustain. Recently professionally set up and ready to play.',
      startPrice: 2500, currentPrice: 2500, buyNowPrice: 8000,
      condition: 'excellent', auctionType: 'english',
      endTime: futureDate(7), sellerId: users[0].id, categoryId: categories[9].id,
      images: '[]', location: 'New York, NY'
    },
    {
      title: 'MacBook Pro M3 Max — 96GB RAM',
      description: 'Brand new MacBook Pro with M3 Max chip, 96GB unified memory, 2TB SSD. Space Black finish. Still sealed in original packaging with Apple warranty.',
      startPrice: 3000, currentPrice: 3000, buyNowPrice: 3800,
      condition: 'new', auctionType: 'english',
      endTime: futureDate(5), sellerId: users[1].id, categoryId: categories[0].id,
      images: '[]', location: 'Los Angeles, CA'
    },
    {
      title: 'Original Banksy Print — "Girl With Balloon"',
      description: 'Authenticated Banksy "Girl With Balloon" print. Comes with certificate of authenticity from Pest Control. Edition of 150. Museum-quality framing included.',
      startPrice: 15000, currentPrice: 15000,
      condition: 'excellent', auctionType: 'english',
      endTime: futureDate(14), sellerId: users[1].id, categoryId: categories[4].id,
      images: '[]', location: 'Los Angeles, CA'
    },
    {
      title: 'Rolex Submariner Date 2023',
      description: 'Rolex Submariner Date ref. 126610LN. Unworn with original box, papers, and full warranty. Black dial with date function. The iconic dive watch.',
      startPrice: 12000, currentPrice: 12000, buyNowPrice: 15000,
      condition: 'new', auctionType: 'english',
      endTime: futureDate(10), sellerId: users[0].id, categoryId: categories[7].id,
      images: '[]', location: 'New York, NY'
    },
    {
      title: 'Signed Michael Jordan Jersey — 1996 Bulls',
      description: 'Authentic Michael Jordan #23 Chicago Bulls jersey from the 1996 championship season. Hand-signed with JSA authentication. Displayed in UV-protected case.',
      startPrice: 5000, currentPrice: 5000,
      condition: 'excellent', auctionType: 'english',
      endTime: futureDate(8), sellerId: users[2].id, categoryId: categories[5].id,
      images: '[]', location: 'Chicago, IL'
    },
    {
      title: 'Tesla Model S Plaid 2024 — Low Miles',
      description: 'Tesla Model S Plaid with only 2,000 miles. Midnight Silver Metallic with white interior. Full self-driving capability included. Extended warranty.',
      startPrice: 65000, currentPrice: 65000, buyNowPrice: 82000,
      condition: 'like_new', auctionType: 'english',
      endTime: futureDate(21), sellerId: users[1].id, categoryId: categories[3].id,
      images: '[]', location: 'Los Angeles, CA'
    },
    {
      title: 'First Edition Harry Potter — Philosopher\'s Stone',
      description: 'True first edition, first printing of Harry Potter and the Philosopher\'s Stone (1997). Hardcover with original dust jacket. One of only 500 copies printed.',
      startPrice: 35000, currentPrice: 35000,
      condition: 'good', auctionType: 'sealed',
      endTime: futureDate(12), sellerId: users[0].id, categoryId: categories[6].id,
      images: '[]', location: 'New York, NY'
    },
    {
      title: 'Herman Miller Eames Lounge Chair & Ottoman',
      description: 'Authentic Herman Miller Eames Lounge Chair and Ottoman in santos palisander veneer with black MCL leather. Purchased in 2022, barely used. Comes with Herman Miller authenticity certificate.',
      startPrice: 4000, currentPrice: 4000, buyNowPrice: 5500,
      condition: 'like_new', auctionType: 'english',
      endTime: futureDate(6), sellerId: users[2].id, categoryId: categories[2].id,
      images: '[]', location: 'Chicago, IL'
    },
    {
      title: 'Nintendo Switch OLED + 20 Games Bundle',
      description: 'Nintendo Switch OLED White edition with 20 physical games including Zelda TOTK, Mario Odyssey, Smash Bros. Two pro controllers and carrying case included.',
      startPrice: 400, currentPrice: 400, buyNowPrice: 600,
      condition: 'excellent', auctionType: 'dutch',
      endTime: futureDate(3), sellerId: users[2].id, categoryId: categories[8].id,
      images: '[]', location: 'Chicago, IL'
    },
    {
      title: 'Gucci GG Marmont Small Shoulder Bag',
      description: 'Authentic Gucci GG Marmont small matelassé shoulder bag in dusty pink chevron leather. Double G hardware. Comes with dust bag, box, and receipt.',
      startPrice: 1200, currentPrice: 1200, buyNowPrice: 1800,
      condition: 'excellent', auctionType: 'english',
      endTime: futureDate(4), sellerId: users[0].id, categoryId: categories[1].id,
      images: '[]', location: 'New York, NY'
    }
  ];

  for (const item of items) {
    const created = await prisma.item.create({ data: item });

    // Add shipping options
    await prisma.shippingOption.createMany({
      data: [
        { name: 'Standard', price: 9.99, estimatedDays: 7, itemId: created.id },
        { name: 'Express', price: 19.99, estimatedDays: 3, itemId: created.id },
        { name: 'Overnight', price: 34.99, estimatedDays: 1, itemId: created.id }
      ]
    });
  }

  // Add some bids
  const allItems = await prisma.item.findMany();
  const bidData = [
    { amount: 2600, bidderId: users[1].id, itemId: allItems[0].id },
    { amount: 2750, bidderId: users[2].id, itemId: allItems[0].id },
    { amount: 3100, bidderId: users[0].id, itemId: allItems[1].id },
    { amount: 3200, bidderId: users[2].id, itemId: allItems[1].id },
    { amount: 16000, bidderId: users[2].id, itemId: allItems[2].id },
    { amount: 12500, bidderId: users[1].id, itemId: allItems[3].id },
    { amount: 5200, bidderId: users[0].id, itemId: allItems[4].id },
    { amount: 5500, bidderId: users[1].id, itemId: allItems[4].id },
  ];

  for (const bid of bidData) {
    await prisma.bid.create({ data: bid });
    await prisma.item.update({
      where: { id: bid.itemId },
      data: { currentPrice: bid.amount }
    });
  }

  // Add some ratings
  await prisma.rating.createMany({
    data: [
      { score: 5, comment: 'Excellent seller! Item exactly as described. Fast shipping.', raterId: users[1].id, ratedUserId: users[0].id },
      { score: 4, comment: 'Great communication and item quality. Would buy again.', raterId: users[2].id, ratedUserId: users[0].id },
      { score: 5, comment: 'Top-notch dealer. Incredible art collection.', raterId: users[0].id, ratedUserId: users[1].id },
      { score: 5, comment: 'Very trustworthy seller. Highly recommended!', raterId: users[2].id, ratedUserId: users[1].id },
      { score: 4, comment: 'Great items, well packaged. Minor delay in shipping.', raterId: users[0].id, ratedUserId: users[2].id }
    ]
  });

  console.log('✅ Seed complete!');
  console.log(`  📦 ${categories.length} categories`);
  console.log(`  👤 ${users.length} users (password: password123)`);
  console.log(`  🏷️  ${items.length} items`);
  console.log(`  💰 ${bidData.length} bids`);
  console.log(`  ⭐ 5 ratings`);
  console.log('\n  Login as: demo@example.com / password123');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
