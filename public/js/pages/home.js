/* ============================================
   Home Page
   ============================================ */
const HomePage = {
  async render(container) {
    let platformStats = { totalUsers: 0, totalItems: 0, totalBids: 0, activeAuctions: 0 };
    let featuredItems = [];
    let categories = [];

    try {
      [platformStats, { items: featuredItems }, categories] = await Promise.all([
        App.api('/analytics/platform'),
        App.api('/items?limit=8&sort=most_bids'),
        App.api('/categories')
      ]);
    } catch (e) { console.error(e); }

    const endingSoon = featuredItems.filter(i => {
      const cd = App.getCountdown(i.endTime);
      return !cd.expired && cd.days < 2;
    });

    container.innerHTML = `
      <!-- Hero -->
      <section class="hero">
        <div class="hero-float hero-float-1">
          <span>🔥</span><span style="font-size:0.8rem;font-weight:600;">Live Auctions</span>
          <span style="color:var(--accent-green);font-weight:700;">${platformStats.activeAuctions}</span>
        </div>
        <div class="hero-float hero-float-2">
          <span>💰</span><span style="font-size:0.8rem;font-weight:600;">Total Bids</span>
          <span style="color:var(--accent-gold);font-weight:700;">${platformStats.totalBids}</span>
        </div>
        <div class="hero-content">
          <div class="hero-badge">
            <span>⚡</span> The Future of Online Auctions
          </div>
          <h1 class="hero-title">
            Discover & Bid on<br>
            <span class="gradient-text">Extraordinary Items</span>
          </h1>
          <p class="hero-subtitle">
            From rare collectibles to luxury goods — find unique treasures and bid with confidence on our premium auction platform.
          </p>
          <div class="hero-actions">
            <a href="#/explore" class="btn btn-primary btn-lg">Explore Auctions</a>
            <a href="#/register" class="btn btn-outline btn-lg">Start Selling</a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-value">${platformStats.activeAuctions}</div>
              <div class="hero-stat-label">Active Auctions</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">${platformStats.totalUsers}</div>
              <div class="hero-stat-label">Trusted Sellers</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">${platformStats.totalBids}</div>
              <div class="hero-stat-label">Bids Placed</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">${platformStats.totalItems}</div>
              <div class="hero-stat-label">Items Listed</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="section container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Browse Categories</h2>
            <p class="section-subtitle">Find exactly what you're looking for</p>
          </div>
        </div>
        <div class="categories-strip">
          ${categories.map(c => `
            <a href="#/explore?category=${c.id}" class="category-chip">
              <span class="icon">${c.icon}</span>
              <span>${c.name}</span>
              <span class="count">${c._count?.items || 0}</span>
            </a>
          `).join('')}
        </div>
      </section>

      <!-- Featured Items -->
      <section class="section container">
        <div class="section-header">
          <div>
            <h2 class="section-title">🔥 Trending Auctions</h2>
            <p class="section-subtitle">Most popular items with the highest activity</p>
          </div>
          <a href="#/explore?sort=most_bids" class="btn btn-outline btn-sm">View All</a>
        </div>
        <div class="items-grid">
          ${featuredItems.map(item => App.itemCard(item)).join('')}
        </div>
      </section>

      ${endingSoon.length > 0 ? `
      <!-- Ending Soon -->
      <section class="section container">
        <div class="section-header">
          <div>
            <h2 class="section-title">⏰ Ending Soon</h2>
            <p class="section-subtitle">Last chance to bid on these items</p>
          </div>
          <a href="#/explore?sort=ending_soon" class="btn btn-outline btn-sm">View All</a>
        </div>
        <div class="items-grid">
          ${endingSoon.map(item => App.itemCard(item)).join('')}
        </div>
      </section>
      ` : ''}

      <!-- CTA Section -->
      <section class="section container" style="text-align:center;">
        <div style="background:var(--gradient-card);border:1px solid var(--border-primary);border-radius:var(--radius-xl);padding:3rem 2rem;">
          <h2 style="font-size:2rem;font-weight:800;margin-bottom:0.75rem;">Ready to Start Selling?</h2>
          <p style="color:var(--text-secondary);max-width:500px;margin:0 auto 1.5rem;font-size:0.95rem;">
            List your items and reach thousands of eager buyers. Setting up is free and takes just minutes.
          </p>
          <a href="#/sell" class="btn btn-primary btn-lg">List an Item</a>
        </div>
      </section>
    `;
  }
};
