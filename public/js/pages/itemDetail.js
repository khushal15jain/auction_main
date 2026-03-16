/* ============================================
   Item Detail Page
   ============================================ */
const ItemDetailPage = {
  currentItem: null,
  bidTimer: null,

  async render(container, itemId) {
    try {
      const item = await App.api(`/items/${itemId}`);
      this.currentItem = item;
      const images = JSON.parse(item.images || '[]');
      const countdown = App.getCountdown(item.endTime);
      const isOwner = App.user && App.user.id === item.sellerId;
      const isActive = item.status === 'active' && !countdown.expired;

      container.innerHTML = `
        <div class="item-detail">
          <div class="item-detail-grid">
            <!-- Gallery -->
            <div>
              <div class="item-gallery">
                <div class="item-gallery-main" id="main-image">
                  ${images.length > 0
                    ? `<img src="${images[0]}" alt="${item.title}">`
                    : `<span style="font-size:5rem;">${item.category?.icon || '📦'}</span>`
                  }
                </div>
                ${images.length > 1 ? `
                  <div class="item-gallery-thumbs">
                    ${images.map((img, i) => `
                      <div class="item-gallery-thumb ${i === 0 ? 'active' : ''}" onclick="ItemDetailPage.switchImage('${img}', this)">
                        <img src="${img}" alt="Thumbnail ${i + 1}">
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Description -->
              <div style="margin-top:1.5rem;">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.75rem;">Description</h3>
                <div class="item-info-description">${item.description}</div>
              </div>

              <!-- Item Details -->
              <div style="margin-top:1.5rem;">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.75rem;">Details</h3>
                <div class="item-info-details">
                  <div class="detail-item">
                    <div class="detail-item-label">Condition</div>
                    <div class="detail-item-value">${item.condition}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-label">Auction Type</div>
                    <div class="detail-item-value">${item.auctionType}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-label">Location</div>
                    <div class="detail-item-value">${item.location || 'Not specified'}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-label">Views</div>
                    <div class="detail-item-value">${item.views}</div>
                  </div>
                </div>
              </div>

              <!-- Reviews Section -->
              <div style="margin-top:1.5rem;" id="reviews-section">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.75rem;">Reviews</h3>
                <div id="item-reviews"></div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="item-info">
              <div class="item-info-header">
                <div class="item-info-category">${item.category?.icon || ''} ${item.category?.name || ''}</div>
                <h1 class="item-info-title">${item.title}</h1>
                <div class="item-info-seller" onclick="App.navigate('/user/${item.seller.id}')">
                  <div class="avatar avatar-sm">${item.seller.avatar ? `<img src="${item.seller.avatar}">` : item.seller.name?.[0]}</div>
                  <div>
                    <div class="item-info-seller-name">${item.seller.name}</div>
                    <div class="item-info-seller-rating">⭐ Verified Seller</div>
                  </div>
                </div>
              </div>

              <!-- Bid Panel -->
              <div class="bid-panel" id="bid-panel">
                ${BidPanel.render(item, isOwner, isActive)}
              </div>

              <!-- Actions -->
              <div style="display:flex;gap:0.5rem;">
                ${!isOwner ? `
                  <button class="btn btn-outline" style="flex:1;" onclick="ItemDetailPage.toggleWatch('${item.id}')" id="watch-btn">
                    ${item.isWatched ? '❤️ Watching' : '🤍 Watch'}
                  </button>
                  ${item.seller ? `<button class="btn btn-outline" style="flex:1;" onclick="App.navigate('/messages/${item.seller.id}')">💬 Message Seller</button>` : ''}
                ` : `
                  <a href="#/edit-item/${item.id}" class="btn btn-outline" style="flex:1;">✏️ Edit Listing</a>
                  <button class="btn btn-danger" style="flex:1;" onclick="ItemDetailPage.deleteItem('${item.id}')">🗑 Delete</button>
                `}
              </div>

              <!-- Shipping Options -->
              ${item.shippingOptions?.length > 0 ? `
                <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:1rem;margin-top:0.5rem;">
                  <h4 style="font-size:0.85rem;font-weight:600;margin-bottom:0.5rem;">📦 Shipping Options</h4>
                  ${item.shippingOptions.map(s => `
                    <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.85rem;">
                      <span style="color:var(--text-secondary);">${s.name} (${s.estimatedDays} days)</span>
                      <span style="font-weight:600;">${App.formatPrice(s.price)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Load reviews
      RatingsComponent.loadItemReviews(item.id, item.seller.id);

      // Setup Socket.io for real-time bids
      if (App.socket) {
        App.socket.emit('joinAuction', itemId);
        App.socket.on('newBid', (data) => {
          if (data.itemId === itemId) {
            this.currentItem.currentPrice = data.currentPrice;
            BidPanel.updatePrice(data.currentPrice, data.bid);
          }
        });
        App.socket.on('auctionEnd', (data) => {
          if (data.itemId === itemId) {
            BidPanel.showEnded(data.winner);
          }
        });
      }

      // Start countdown timer
      if (isActive) BidPanel.startTimer(item.endTime);

    } catch (err) {
      container.innerHTML = `<div class="page-container container"><div class="empty-state"><div class="empty-state-icon">😕</div><div class="empty-state-title">Item Not Found</div><a href="#/" class="btn btn-primary">Go Home</a></div></div>`;
    }
  },

  switchImage(src, thumb) {
    document.getElementById('main-image').innerHTML = `<img src="${src}" alt="Item">`;
    document.querySelectorAll('.item-gallery-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  },

  async toggleWatch(itemId) {
    if (!App.user) return App.navigate('/login');
    try {
      const data = await App.api('/watchlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      const btn = document.getElementById('watch-btn');
      btn.innerHTML = data.watched ? '❤️ Watching' : '🤍 Watch';
      App.toast(data.watched ? 'Added to watchlist' : 'Removed from watchlist', 'success');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await App.api(`/items/${itemId}`, { method: 'DELETE' });
      App.toast('Listing deleted', 'success');
      App.navigate('/my-listings');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};
