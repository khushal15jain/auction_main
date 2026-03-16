/* ============================================
   Analytics Page
   ============================================ */
const AnalyticsPage = {
  async render(container) {
    try {
      const stats = await App.api('/analytics/seller');

      const months = Object.keys(stats.revenueByMonth || {});
      const maxRevenue = Math.max(...Object.values(stats.revenueByMonth || { '': 1 }), 1);

      container.innerHTML = `
        <div class="page-container container">
          <h1 class="section-title" style="margin-bottom:0.5rem;">📊 Seller Analytics</h1>
          <p style="color:var(--text-secondary);margin-bottom:2rem;">Track your performance and revenue</p>

          <div class="analytics-grid">
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(124,58,237,0.1);">📦</div>
              <div class="stat-card-label">Total Listings</div>
              <div class="stat-card-value">${stats.totalListings}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(16,185,129,0.1);">✅</div>
              <div class="stat-card-label">Items Sold</div>
              <div class="stat-card-value">${stats.soldItems}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(6,182,212,0.1);">🔴</div>
              <div class="stat-card-label">Active Listings</div>
              <div class="stat-card-value">${stats.activeListings}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(245,158,11,0.1);">💰</div>
              <div class="stat-card-label">Total Revenue</div>
              <div class="stat-card-value">${App.formatPrice(stats.totalRevenue)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(236,72,153,0.1);">👁</div>
              <div class="stat-card-label">Total Views</div>
              <div class="stat-card-value">${stats.totalViews}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(124,58,237,0.1);">🔨</div>
              <div class="stat-card-label">Total Bids</div>
              <div class="stat-card-value">${stats.totalBids}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background:rgba(239,68,68,0.1);">❤️</div>
              <div class="stat-card-label">Watchers</div>
              <div class="stat-card-value">${stats.totalWatchers}</div>
            </div>
          </div>

          ${months.length > 0 ? `
            <div class="chart-container">
              <div class="chart-title">Revenue Over Time</div>
              <div class="chart-bar-container">
                ${months.map(month => {
                  const height = (stats.revenueByMonth[month] / maxRevenue) * 100;
                  return `
                    <div class="chart-bar" style="height:${Math.max(height, 5)}%;" title="${App.formatPrice(stats.revenueByMonth[month])}">
                      <div class="chart-bar-label">${month.split('-')[1]}/${month.split('-')[0].slice(2)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          ${stats.topItems?.length > 0 ? `
            <div class="chart-container">
              <div class="chart-title">Top Items by Views</div>
              ${stats.topItems.map(item => `
                <div style="display:flex;align-items:center;gap:1rem;padding:0.75rem 0;border-bottom:1px solid var(--border-primary);">
                  <div style="flex:1;font-weight:500;cursor:pointer;" onclick="App.navigate('/item/${item.id}')">${item.title}</div>
                  <div style="font-size:0.8rem;color:var(--text-muted);">👁 ${item.views} views</div>
                  <div style="font-size:0.8rem;color:var(--accent-purple);">🔨 ${item.bids} bids</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};
