/* ============================================
   AuctionVerse — Core SPA Application
   ============================================ */

const App = {
  token: localStorage.getItem('av_token'),
  user: JSON.parse(localStorage.getItem('av_user') || 'null'),
  socket: null,
  currentPage: null,

  // API Helper
  async api(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    
    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }
    
    try {
      const res = await fetch(`/api${url}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      throw err;
    }
  },

  // Authentication
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('av_token', token);
    localStorage.setItem('av_user', JSON.stringify(user));
    this.updateNav();
    this.initSocket();
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('av_token');
    localStorage.removeItem('av_user');
    if (this.socket) this.socket.disconnect();
    this.updateNav();
    this.navigate('/');
  },

  // Navigation
  updateNav() {
    const guest = document.getElementById('nav-guest');
    const userNav = document.getElementById('nav-user');
    
    if (this.user) {
      guest.classList.add('hidden');
      userNav.classList.remove('hidden');
      document.getElementById('nav-avatar-initial').textContent = this.user.name?.[0] || 'U';
      document.getElementById('dropdown-user-name').textContent = this.user.name;
      
      if (this.user.avatar) {
        document.getElementById('nav-avatar').innerHTML = `<img src="${this.user.avatar}" alt="${this.user.name}">`;
      }
    } else {
      guest.classList.remove('hidden');
      userNav.classList.add('hidden');
    }
  },

  // Socket.io
  initSocket() {
    if (this.socket) this.socket.disconnect();
    if (!this.user) return;
    
    this.socket = io();
    this.socket.emit('joinUser', this.user.id);
    
    this.socket.on('outbid', (data) => {
      App.toast(`You've been outbid! New price: ₹${data.amount.toFixed(2)}`, 'info');
      this.updateBadges();
    });
    
    this.socket.on('auctionWon', (data) => {
      App.toast('🎉 Congratulations! You won an auction!', 'success');
      this.updateBadges();
    });
    
    this.socket.on('messageNotification', (data) => {
      App.toast(`New message from ${data.from}`, 'info');
      this.updateBadges();
    });
    
    this.updateBadges();
  },

  async updateBadges() {
    if (!this.user) return;
    try {
      const [msgData, notifData] = await Promise.all([
        this.api('/messages/unread/count'),
        this.api('/notifications/unread')
      ]);
      
      const msgBadge = document.getElementById('msg-badge');
      const notifBadge = document.getElementById('notif-badge');
      
      if (msgData.count > 0) {
        msgBadge.textContent = msgData.count;
        msgBadge.classList.remove('hidden');
      } else {
        msgBadge.classList.add('hidden');
      }
      
      if (notifData.count > 0) {
        notifBadge.textContent = notifData.count;
        notifBadge.classList.remove('hidden');
      } else {
        notifBadge.classList.add('hidden');
      }
    } catch (e) { /* ignore */ }
  },

  // Routing
  navigate(path) {
    window.location.hash = path;
  },

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');
    const app = document.getElementById('app');
    
    // Parse route
    const segments = path.split('/').filter(Boolean);
    const route = '/' + (segments[0] || '');
    const id = segments[1];

    // Scroll to top
    window.scrollTo(0, 0);

    try {
      switch (route) {
        case '/':
          await HomePage.render(app);
          break;
        case '/login':
          AuthPage.renderLogin(app);
          break;
        case '/register':
          AuthPage.renderRegister(app);
          break;
        case '/explore':
          await SearchPage.render(app, params);
          break;
        case '/item':
          await ItemDetailPage.render(app, id);
          break;
        case '/sell':
          if (!this.requireAuth()) return;
          ListingsPage.renderSellForm(app);
          break;
        case '/edit-item':
          if (!this.requireAuth()) return;
          await ListingsPage.renderEditForm(app, id);
          break;
        case '/dashboard':
        case '/profile':
          if (!this.requireAuth()) return;
          await ProfilePage.render(app);
          break;
        case '/user':
          await ProfilePage.renderPublic(app, id);
          break;
        case '/my-listings':
          if (!this.requireAuth()) return;
          await ListingsPage.renderMyListings(app);
          break;
        case '/my-bids':
          if (!this.requireAuth()) return;
          await ProfilePage.renderBids(app);
          break;
        case '/watchlist':
          if (!this.requireAuth()) return;
          await ProfilePage.renderWatchlist(app);
          break;
        case '/messages':
          if (!this.requireAuth()) return;
          await MessagesPage.render(app, id);
          break;
        case '/notifications':
          if (!this.requireAuth()) return;
          await ProfilePage.renderNotifications(app);
          break;
        case '/checkout':
          if (!this.requireAuth()) return;
          await CheckoutPage.render(app, id);
          break;
        case '/analytics':
          if (!this.requireAuth()) return;
          await AnalyticsPage.render(app);
          break;
        default:
          app.innerHTML = `<div class="page-container container"><div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Page Not Found</div><p class="empty-state-text">The page you're looking for doesn't exist.</p><a href="#/" class="btn btn-primary">Go Home</a></div></div>`;
      }
    } catch (err) {
      console.error('Route error:', err);
      app.innerHTML = `<div class="page-container container"><div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Something went wrong</div><p class="empty-state-text">${err.message}</p><a href="#/" class="btn btn-primary">Go Home</a></div></div>`;
    }
  },

  requireAuth() {
    if (!this.user) {
      this.navigate('/login');
      App.toast('Please sign in to continue', 'info');
      return false;
    }
    return true;
  },

  // Toast notifications
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Modal
  showModal(content) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = content;
    overlay.classList.remove('hidden');
    overlay.onclick = (e) => { if (e.target === overlay) this.hideModal(); };
  },

  hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  // Utility: Time ago
  timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  },

  // Utility: Countdown
  getCountdown(endTime) {
    const diff = new Date(endTime) - Date.now();
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      expired: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    };
  },

  // Utility: Format price
  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
  },

  // Utility: Item card HTML
  itemCard(item) {
    const images = JSON.parse(item.images || '[]');
    const countdown = this.getCountdown(item.endTime);
    const categoryIcon = item.category?.icon || '📦';
    const bidCount = item._count?.bids || 0;
    
    let badge = '';
    if (item.status === 'sold') badge = '<span class="item-card-badge badge-sold">Sold</span>';
    else if (countdown.expired) badge = '<span class="item-card-badge badge-sold">Ended</span>';
    else if (countdown.days === 0 && countdown.hours < 6) badge = '<span class="item-card-badge badge-ending">⏰ Ending Soon</span>';
    else badge = '<span class="item-card-badge badge-live">● Live</span>';

    const timerText = countdown.expired ? 'Auction ended' :
      `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m left`;

    return `
      <div class="card item-card animate-in" onclick="App.navigate('/item/${item.id}')">
        <div class="item-card-image">
          ${images.length > 0
            ? `<img src="${images[0]}" alt="${item.title}" loading="lazy">`
            : `<div class="item-card-placeholder">${categoryIcon}</div>`
          }
          ${badge}
        </div>
        <div class="item-card-body">
          <div class="item-card-category">${item.category?.name || 'Uncategorized'}</div>
          <div class="item-card-title">${item.title}</div>
          <div class="item-card-meta">
            <span class="item-card-price">${App.formatPrice(item.currentPrice || item.startPrice)}</span>
            <span class="item-card-bids">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="m6 9 6 6 6-6"/></svg>
              ${bidCount} bid${bidCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div class="item-card-timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${timerText}
          </div>
          ${item.seller ? `
            <div class="item-card-seller">
              <div class="avatar" style="width:22px;height:22px;font-size:0.6rem;">${item.seller.avatar ? `<img src="${item.seller.avatar}" alt="">` : item.seller.name?.[0]}</div>
              ${item.seller.name}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Utility: Pagination
  paginationHTML(page, pages) {
    if (pages <= 1) return '';
    let html = '<div class="pagination">';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="SearchPage.goToPage(${page - 1})">‹</button>`;
    for (let i = 1; i <= Math.min(pages, 7); i++) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="SearchPage.goToPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${page >= pages ? 'disabled' : ''} onclick="SearchPage.goToPage(${page + 1})">›</button>`;
    html += '</div>';
    return html;
  },

  // Stars HTML
  starsHTML(rating, interactive = false) {
    let html = '<div class="stars">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star ${i <= rating ? 'filled' : ''}" ${interactive ? `onclick="RatingsComponent.setRating(${i})"` : ''}>★</span>`;
    }
    html += '</div>';
    return html;
  }
};

// ============================================
// Event Listeners
// ============================================

// Route handling
window.addEventListener('hashchange', () => App.handleRoute());

// Profile dropdown
document.getElementById('nav-avatar-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('profile-dropdown').classList.toggle('hidden');
});

document.addEventListener('click', () => {
  document.getElementById('profile-dropdown')?.classList.add('hidden');
});

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => App.logout());

// Mobile toggle
document.getElementById('mobile-toggle')?.addEventListener('click', () => {
  const actions = document.querySelector('.nav-actions');
  actions.style.display = actions.style.display === 'flex' ? 'none' : 'flex';
});

// Global search
let searchTimeout;
document.getElementById('global-search')?.addEventListener('input', async (e) => {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  const suggestions = document.getElementById('search-suggestions');
  
  if (q.length < 2) {
    suggestions.classList.remove('active');
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const items = await App.api(`/search/suggest?q=${encodeURIComponent(q)}`);
      if (items.length > 0) {
        suggestions.innerHTML = items.map(item => `
          <div class="search-suggestion-item" onclick="App.navigate('/item/${item.id}'); document.getElementById('search-suggestions').classList.remove('active');">
            <span class="title">${item.title}</span>
            <span class="price">${App.formatPrice(item.currentPrice)}</span>
          </div>
        `).join('');
        suggestions.classList.add('active');
      } else {
        suggestions.classList.remove('active');
      }
    } catch (e) { /* ignore */ }
  }, 300);
});

document.getElementById('global-search')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) {
      App.navigate(`/explore?q=${encodeURIComponent(q)}`);
      document.getElementById('search-suggestions').classList.remove('active');
      e.target.value = '';
    }
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper')) {
    document.getElementById('search-suggestions')?.classList.remove('active');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  App.updateNav();
  if (App.user) App.initSocket();
  App.handleRoute();
});
