/* ============================================
   Profile Page (Dashboard, Public, Bids, Watchlist, Notifications)
   ============================================ */
const ProfilePage = {
  async render(container) {
    try {
      const user = await App.api('/auth/me');
      const ratingsData = await App.api(`/ratings/user/${user.id}`);

      container.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar-container">
            <div class="avatar avatar-xl">${user.avatar ? `<img src="${user.avatar}">` : user.name?.[0]}</div>
          </div>
          <h1 class="profile-name">${user.name}</h1>
          <p class="profile-location">📍 ${user.location || 'Location not set'}</p>
          <p class="profile-bio">${user.bio || 'No bio yet'}</p>
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-value">${ratingsData.count}</div>
              <div class="profile-stat-label">Reviews</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">⭐ ${ratingsData.average.toFixed(1)}</div>
              <div class="profile-stat-label">Rating</div>
            </div>
          </div>
        </div>
        <div class="container" style="padding:2rem 1.5rem;">
          <div class="tabs">
            <div class="tab active" onclick="ProfilePage.showTab('edit')">Edit Profile</div>
            <div class="tab" onclick="ProfilePage.showTab('reviews')">Reviews</div>
          </div>
          <div id="profile-tab-content">
            ${this.editProfileForm(user)}
          </div>
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  editProfileForm(user) {
    return `
      <div style="max-width:500px;">
        <form id="edit-profile-form">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" class="form-input" id="edit-name" value="${user.name || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea class="form-textarea" id="edit-bio" placeholder="Tell us about yourself...">${user.bio || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input" id="edit-location" value="${user.location || ''}" placeholder="City, State">
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-input" id="edit-phone" value="${user.phone || ''}" placeholder="(555) 123-4567">
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>
    `;
  },

  showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    const content = document.getElementById('profile-tab-content');

    if (tab === 'edit') {
      App.api('/auth/me').then(user => {
        content.innerHTML = this.editProfileForm(user);
        this.attachEditFormListener();
      });
    } else if (tab === 'reviews') {
      App.api(`/ratings/user/${App.user.id}`).then(data => {
        content.innerHTML = data.ratings.length > 0 ? data.ratings.map(r => `
          <div class="review-card">
            <div class="review-header">
              <div class="avatar avatar-sm">${r.rater?.avatar ? `<img src="${r.rater.avatar}">` : r.rater?.name?.[0]}</div>
              <div>
                <div class="review-author">${r.rater?.name}</div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  ${App.starsHTML(r.score)}
                  <span class="review-date">${App.timeAgo(r.createdAt)}</span>
                </div>
              </div>
            </div>
            ${r.comment ? `<div class="review-text">${r.comment}</div>` : ''}
          </div>
        `).join('') : '<div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-title">No reviews yet</div></div>';
      });
    }
  },

  attachEditFormListener() {
    document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await App.api('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: document.getElementById('edit-name').value,
            bio: document.getElementById('edit-bio').value,
            location: document.getElementById('edit-location').value,
            phone: document.getElementById('edit-phone').value
          })
        });
        App.user = { ...App.user, ...data };
        localStorage.setItem('av_user', JSON.stringify(App.user));
        App.updateNav();
        App.toast('Profile updated!', 'success');
      } catch (err) {
        App.toast(err.message, 'error');
      }
    });
  },

  async renderPublic(container, userId) {
    try {
      const [user, ratingsData, itemsData] = await Promise.all([
        App.api(`/auth/user/${userId}`),
        App.api(`/ratings/user/${userId}`),
        App.api(`/items?sellerId=${userId}`)
      ]);

      container.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar-container">
            <div class="avatar avatar-xl">${user.avatar ? `<img src="${user.avatar}">` : user.name?.[0]}</div>
          </div>
          <h1 class="profile-name">${user.name}</h1>
          <p class="profile-location">📍 ${user.location || 'Unknown'}</p>
          <p class="profile-bio">${user.bio || ''}</p>
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-value">${user._count?.items || 0}</div>
              <div class="profile-stat-label">Listings</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">⭐ ${(user.avgRating || 0).toFixed(1)}</div>
              <div class="profile-stat-label">Rating</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${ratingsData.count}</div>
              <div class="profile-stat-label">Reviews</div>
            </div>
          </div>
          ${App.user && App.user.id !== userId ? `
            <div style="margin-top:1rem;">
              <a href="#/messages/${userId}" class="btn btn-primary">💬 Send Message</a>
            </div>
          ` : ''}
        </div>
        <div class="container" style="padding:2rem 1.5rem;">
          <h2 class="section-title" style="margin-bottom:1.5rem;">Listings</h2>
          ${itemsData.items.length > 0 ? `
            <div class="items-grid">
              ${itemsData.items.map(item => App.itemCard(item)).join('')}
            </div>
          ` : '<div class="empty-state"><div class="empty-state-title">No active listings</div></div>'}

          <h2 class="section-title" style="margin:2rem 0 1rem;">Reviews</h2>
          ${ratingsData.ratings.length > 0 ? ratingsData.ratings.map(r => `
            <div class="review-card">
              <div class="review-header">
                <div class="avatar avatar-sm">${r.rater?.avatar ? `<img src="${r.rater.avatar}">` : r.rater?.name?.[0]}</div>
                <div>
                  <div class="review-author">${r.rater?.name}</div>
                  <div style="display:flex;align-items:center;gap:0.5rem;">${App.starsHTML(r.score)} <span class="review-date">${App.timeAgo(r.createdAt)}</span></div>
                </div>
              </div>
              ${r.comment ? `<div class="review-text">${r.comment}</div>` : ''}
            </div>
          `).join('') : '<div class="empty-state"><div class="empty-state-title">No reviews yet</div></div>'}
        </div>
      `;
    } catch (err) {
      App.toast('User not found', 'error');
      App.navigate('/');
    }
  },

  async renderBids(container) {
    try {
      const bids = await App.api('/bids/my');
      container.innerHTML = `
        <div class="page-container container">
          <h1 class="section-title" style="margin-bottom:1.5rem;">My Bids</h1>
          ${bids.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
              ${bids.map(bid => `
                <div class="card" style="padding:1rem;cursor:pointer;" onclick="App.navigate('/item/${bid.item.id}')">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-weight:600;">${bid.item.title}</div>
                      <div style="font-size:0.8rem;color:var(--text-muted);">Bid placed ${App.timeAgo(bid.createdAt)}</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:1.1rem;font-weight:700;color:var(--accent-green);">${App.formatPrice(bid.amount)}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">${bid.item.status === 'sold' ? '🏆 Ended' : '⏳ Active'}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">💰</div>
              <div class="empty-state-title">No Bids Yet</div>
              <p class="empty-state-text">Start bidding on items you like</p>
              <a href="#/explore" class="btn btn-primary">Explore Auctions</a>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async renderWatchlist(container) {
    try {
      const items = await App.api('/watchlist');
      container.innerHTML = `
        <div class="page-container container">
          <h1 class="section-title" style="margin-bottom:1.5rem;">❤️ My Watchlist</h1>
          ${items.length > 0 ? `
            <div class="items-grid">
              ${items.map(item => App.itemCard(item)).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">❤️</div>
              <div class="empty-state-title">Watchlist Empty</div>
              <p class="empty-state-text">Save items to keep track of auctions you're interested in</p>
              <a href="#/explore" class="btn btn-primary">Browse Items</a>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async renderNotifications(container) {
    try {
      const notifications = await App.api('/notifications');
      await App.api('/notifications/read-all', { method: 'PUT' });
      App.updateBadges();

      const iconMap = {
        'outbid': '💸', 'auction_won': '🏆', 'message': '💬',
        'rating': '⭐', 'payment': '💳'
      };

      container.innerHTML = `
        <div class="page-container container">
          <h1 class="section-title" style="margin-bottom:1.5rem;">🔔 Notifications</h1>
          ${notifications.length > 0 ? `
            <div class="card">
              ${notifications.map(n => `
                <div class="notification-item ${!n.read ? 'unread' : ''}" onclick="${n.link ? `App.navigate('${n.link}')` : ''}">
                  <div class="notification-icon">${iconMap[n.type] || '📢'}</div>
                  <div class="notification-content">
                    <div class="notification-text">${n.message}</div>
                    <div class="notification-time">${App.timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <div class="empty-state-title">No Notifications</div>
              <p class="empty-state-text">You're all caught up!</p>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};

// Attach edit form listener after page render
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => ProfilePage.attachEditFormListener(), 500);
});
