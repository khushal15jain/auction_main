/* ============================================
   Checkout Page
   ============================================ */
const CheckoutPage = {
  async render(container, itemId) {
    try {
      const item = await App.api(`/items/${itemId}`);
      const shippingOptions = await fetch('/api/shipping/options').then(r => r.json());

      container.innerHTML = `
        <div class="page-container container">
          <h1 class="section-title" style="margin-bottom:2rem;">🛒 Checkout</h1>
          <div class="checkout-grid">
            <div>
              <div class="card" style="padding:1.5rem;margin-bottom:1.5rem;">
                <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Shipping Address</h3>
                <form id="checkout-form">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="ship-name" value="${App.user.name}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" class="form-input" id="ship-address" placeholder="123 Main St" required>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div class="form-group">
                      <label class="form-label">City</label>
                      <input type="text" class="form-input" id="ship-city" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label">ZIP Code</label>
                      <input type="text" class="form-input" id="ship-zip" required>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Shipping Method</label>
                    ${shippingOptions.map((opt, i) => `
                      <label class="filter-option" style="padding:0.6rem;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:0.5rem;">
                        <input type="radio" name="shipping" value="${opt.name}" ${i === 0 ? 'checked' : ''} onchange="CheckoutPage.updateTotal('${opt.basePrice}')">
                        <span style="flex:1;">${opt.name} — ${opt.estimatedDays}</span>
                        <span style="font-weight:600;">${App.formatPrice(opt.basePrice)}</span>
                      </label>
                    `).join('')}
                  </div>

                  <h3 style="font-size:1rem;font-weight:700;margin:1.5rem 0 1rem;">💳 Payment</h3>
                  <div class="form-group">
                    <label class="form-label">Card Number</label>
                    <input type="text" class="form-input" placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242" required>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div class="form-group">
                      <label class="form-label">Expiry</label>
                      <input type="text" class="form-input" placeholder="MM/YY" value="12/28" required>
                    </div>
                    <div class="form-group">
                      <label class="form-label">CVC</label>
                      <input type="text" class="form-input" placeholder="123" value="123" required>
                    </div>
                  </div>
                  <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:1rem;">
                    🔒 This is a simulated payment. No real charges will be made.
                  </p>
                  <button type="submit" class="btn btn-primary btn-block btn-lg" id="pay-btn">
                    Complete Purchase
                  </button>
                </form>
              </div>
            </div>

            <div>
              <div class="order-summary">
                <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Order Summary</h3>
                <div class="order-item">
                  <div class="order-item-image">
                    ${(() => { const imgs = JSON.parse(item.images || '[]'); return imgs.length ? `<img src="${imgs[0]}" style="width:100%;height:100%;object-fit:cover;">` : item.category?.icon || '📦'; })()}
                  </div>
                  <div>
                    <div style="font-weight:600;font-size:0.9rem;">${item.title}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">Won auction</div>
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.9rem;">
                  <span style="color:var(--text-secondary);">Item Price</span>
                  <span>${App.formatPrice(item.currentPrice)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.9rem;">
                  <span style="color:var(--text-secondary);">Shipping</span>
                  <span id="shipping-cost">${App.formatPrice(shippingOptions[0]?.basePrice || 5.99)}</span>
                </div>
                <div class="order-total">
                  <span>Total</span>
                  <span id="order-total" style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                    ${App.formatPrice((item.currentPrice || 0) + (shippingOptions[0]?.basePrice || 5.99))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.itemPrice = item.currentPrice;
      this.itemId = itemId;

      document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('pay-btn');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
          const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
          const address = `${document.getElementById('ship-name').value}, ${document.getElementById('ship-address').value}, ${document.getElementById('ship-city').value} ${document.getElementById('ship-zip').value}`;

          await App.api('/payments/checkout', {
            method: 'POST',
            body: JSON.stringify({ itemId: this.itemId, shippingMethod, shippingAddress: address })
          });

          App.toast('🎉 Payment successful! Your item is on its way!', 'success');
          App.navigate('/dashboard');
        } catch (err) {
          App.toast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Complete Purchase';
        }
      });
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  updateTotal(shippingCost) {
    const shipping = parseFloat(shippingCost);
    document.getElementById('shipping-cost').textContent = App.formatPrice(shipping);
    document.getElementById('order-total').textContent = App.formatPrice(this.itemPrice + shipping);
  }
};
