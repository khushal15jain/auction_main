/* ============================================
   Bid Panel Component
   ============================================ */
const BidPanel = {
  timerInterval: null,

  render(item, isOwner, isActive) {
    const price = item.currentPrice || item.startPrice;
    const bidCount = item._count?.bids || item.bids?.length || 0;

    if (!isActive) {
      const winner = item.bids?.[0];
      return `
        <div class="bid-panel-price">
          <div class="bid-panel-label">Final Price</div>
          <div class="bid-panel-amount">${App.formatPrice(price)}</div>
          <div style="color:var(--text-muted);font-size:0.85rem;">Auction ended</div>
        </div>
        ${winner ? `
          <div style="text-align:center;padding:1rem;background:rgba(16,185,129,0.1);border-radius:var(--radius-sm);margin-top:1rem;">
            <div style="font-size:1.5rem;margin-bottom:0.25rem;">🏆</div>
            <div style="font-weight:600;">Won by ${winner.bidder?.name || 'Unknown'}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">for ${App.formatPrice(winner.amount)}</div>
          </div>
          ${App.user && App.user.id === winner.bidderId ? `
            <a href="#/checkout/${item.id}" class="btn btn-primary btn-block btn-lg" style="margin-top:1rem;">
              💳 Proceed to Checkout
            </a>
          ` : ''}
        ` : `
          <div style="text-align:center;padding:1rem;background:rgba(239,68,68,0.1);border-radius:var(--radius-sm);margin-top:1rem;">
            <div>No bids received</div>
          </div>
        `}
      `;
    }

    const minBid = (price * 1.01).toFixed(2);

    return `
      <div class="bid-panel-price">
        <div class="bid-panel-label">Current Bid</div>
        <div class="bid-panel-amount" id="current-price">${App.formatPrice(price)}</div>
        <div class="bid-panel-bids" id="bid-count">${bidCount} bid${bidCount !== 1 ? 's' : ''}</div>
      </div>

      <div class="bid-panel-timer" id="auction-timer">
        <div class="timer-unit"><div class="timer-value" id="timer-days">0</div><div class="timer-label">Days</div></div>
        <div class="timer-unit"><div class="timer-value" id="timer-hours">0</div><div class="timer-label">Hours</div></div>
        <div class="timer-unit"><div class="timer-value" id="timer-mins">0</div><div class="timer-label">Mins</div></div>
        <div class="timer-unit"><div class="timer-value" id="timer-secs">0</div><div class="timer-label">Secs</div></div>
      </div>

      ${!isOwner ? `
        <div class="bid-input-group">
          <input type="number" class="form-input" id="bid-amount" placeholder="Enter bid" 
                 step="0.01" min="${minBid}" value="${minBid}">
          <button class="btn btn-primary" onclick="BidPanel.placeBid('${item.id}')">Bid</button>
        </div>

        <div class="bid-quick-amounts">
          ${[1.05, 1.10, 1.25, 1.50].map(mult => {
            const val = (price * mult).toFixed(2);
            return `<button class="bid-quick-btn" onclick="document.getElementById('bid-amount').value='${val}'">+${Math.round((mult - 1) * 100)}%</button>`;
          }).join('')}
        </div>

        ${item.buyNowPrice ? `
          <button class="btn btn-gold btn-block" onclick="BidPanel.buyNow('${item.id}', ${item.buyNowPrice})" style="margin-bottom:1rem;">
            ⚡ Buy Now — ${App.formatPrice(item.buyNowPrice)}
          </button>
        ` : ''}

        <details style="margin-top:0.5rem;">
          <summary style="cursor:pointer;font-size:0.85rem;color:var(--text-secondary);font-weight:600;">🤖 Auto-Bid Setup</summary>
          <div style="padding:0.75rem 0;">
            <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;">Set a maximum — we'll bid automatically for you up to this amount.</p>
            <div class="bid-input-group">
              <input type="number" class="form-input" id="auto-bid-max" placeholder="Max auto-bid" step="0.01">
              <button class="btn btn-outline" onclick="BidPanel.placeAutoBid('${item.id}')">Set</button>
            </div>
          </div>
        </details>
      ` : `
        <div style="text-align:center;padding:1rem;background:var(--bg-tertiary);border-radius:var(--radius-sm);">
          <p style="color:var(--text-muted);font-size:0.85rem;">This is your listing</p>
        </div>
      `}

      <!-- Bid History -->
      <div class="bid-history" id="bid-history-section">
        <div class="bid-history-title">Recent Bids</div>
        <div id="bid-history-list">
          ${(item.bids || []).slice(0, 5).map(bid => `
            <div class="bid-history-item">
              <div class="bid-history-user">
                <div class="avatar" style="width:24px;height:24px;font-size:0.6rem;">${bid.bidder?.avatar ? `<img src="${bid.bidder.avatar}">` : bid.bidder?.name?.[0]}</div>
                <span>${bid.bidder?.name || 'Anonymous'}</span>
              </div>
              <div>
                <span class="bid-history-amount">${App.formatPrice(bid.amount)}</span>
                <span class="bid-history-time">${App.timeAgo(bid.createdAt)}</span>
              </div>
            </div>
          `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem 0;">No bids yet. Be the first!</div>'}
        </div>
      </div>
    `;
  },

  async placeBid(itemId) {
    if (!App.user) return App.navigate('/login');
    const amountInput = document.getElementById('bid-amount');
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return App.toast('Enter a valid bid amount', 'error');

    try {
      const result = await App.api('/bids', {
        method: 'POST',
        body: JSON.stringify({ itemId, amount })
      });
      App.toast(`Bid of ${App.formatPrice(amount)} placed! 🎉`, 'success');
      amountInput.value = (amount * 1.01).toFixed(2);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async placeAutoBid(itemId) {
    if (!App.user) return App.navigate('/login');
    const maxInput = document.getElementById('auto-bid-max');
    const maxAmount = parseFloat(maxInput.value);
    if (!maxAmount || maxAmount <= 0) return App.toast('Enter a valid max bid', 'error');

    const currentPrice = parseFloat(document.getElementById('bid-amount')?.value || 0);
    const bidAmount = currentPrice || maxAmount * 0.5;

    try {
      await App.api('/bids', {
        method: 'POST',
        body: JSON.stringify({ itemId, amount: bidAmount, isAutoBid: true, maxAutoBid: maxAmount })
      });
      App.toast(`Auto-bid set up to ${App.formatPrice(maxAmount)}! 🤖`, 'success');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async buyNow(itemId, price) {
    if (!App.user) return App.navigate('/login');
    if (!confirm(`Buy now for ${App.formatPrice(price)}?`)) return;

    try {
      await App.api('/bids', {
        method: 'POST',
        body: JSON.stringify({ itemId, amount: price })
      });
      App.toast('Item purchased! 🎉', 'success');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  updatePrice(newPrice, bid) {
    const priceEl = document.getElementById('current-price');
    if (priceEl) {
      priceEl.textContent = App.formatPrice(newPrice);
      priceEl.style.animation = 'none';
      setTimeout(() => priceEl.style.animation = 'pulse 0.5s', 10);
    }

    const amountInput = document.getElementById('bid-amount');
    if (amountInput) {
      amountInput.value = (newPrice * 1.01).toFixed(2);
      amountInput.min = (newPrice * 1.01).toFixed(2);
    }

    // Add to bid history
    if (bid) {
      const list = document.getElementById('bid-history-list');
      if (list) {
        const entry = document.createElement('div');
        entry.className = 'bid-history-item';
        entry.style.animation = 'fadeInUp 0.3s ease';
        entry.innerHTML = `
          <div class="bid-history-user">
            <div class="avatar" style="width:24px;height:24px;font-size:0.6rem;">${bid.bidder?.name?.[0] || '?'}</div>
            <span>${bid.bidder?.name || 'Anonymous'}</span>
          </div>
          <div>
            <span class="bid-history-amount">${App.formatPrice(bid.amount)}</span>
            <span class="bid-history-time">just now</span>
          </div>
        `;
        list.insertBefore(entry, list.firstChild);
      }
    }
  },

  showEnded(winner) {
    const panel = document.getElementById('bid-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div style="text-align:center;padding:1.5rem;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">${winner ? '🏆' : '⏰'}</div>
        <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;">Auction Ended!</div>
        ${winner ? `<p style="color:var(--text-secondary);">Won by <strong>${winner.name}</strong> for ${App.formatPrice(winner.amount)}</p>` : '<p style="color:var(--text-muted);">No bids received</p>'}
      </div>
    `;
  },

  startTimer(endTime) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const cd = App.getCountdown(endTime);
      const days = document.getElementById('timer-days');
      const hours = document.getElementById('timer-hours');
      const mins = document.getElementById('timer-mins');
      const secs = document.getElementById('timer-secs');

      if (!days) { clearInterval(this.timerInterval); return; }

      if (cd.expired) {
        clearInterval(this.timerInterval);
        days.textContent = '0'; hours.textContent = '0';
        mins.textContent = '0'; secs.textContent = '0';
        return;
      }

      days.textContent = cd.days;
      hours.textContent = cd.hours;
      mins.textContent = cd.minutes;
      secs.textContent = cd.seconds;
    }, 1000);
  }
};
