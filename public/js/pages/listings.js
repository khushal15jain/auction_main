/* ============================================
   Listings Page (Sell, Edit, My Listings)
   ============================================ */
const ListingsPage = {
  selectedImages: [],

  renderSellForm(container, editItem = null) {
    const isEdit = !!editItem;
    container.innerHTML = `
      <div class="page-container container">
        <div class="sell-form-container">
          <h1 style="font-size:1.75rem;font-weight:800;margin-bottom:0.5rem;">${isEdit ? 'Edit Listing' : '✨ Create New Listing'}</h1>
          <p style="color:var(--text-secondary);margin-bottom:2rem;">${isEdit ? 'Update your listing details' : 'List your item and reach thousands of buyers'}</p>

          <form id="sell-form">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input type="text" class="form-input" id="sell-title" placeholder="e.g., Vintage Gibson Les Paul Guitar" required value="${editItem?.title || ''}">
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="sell-desc" placeholder="Describe your item in detail..." required style="min-height:150px;">${editItem?.description || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Images</label>
              <div class="image-upload-zone" id="image-upload-zone" onclick="document.getElementById('sell-images').click()">
                <div class="upload-icon">📸</div>
                <p style="font-weight:600;margin-bottom:0.25rem;">Click to upload images</p>
                <p style="font-size:0.8rem;color:var(--text-muted);">PNG, JPG up to 10MB. Max 10 images.</p>
              </div>
              <input type="file" id="sell-images" accept="image/*" multiple style="display:none;">
              <div class="image-preview-grid" id="image-previews"></div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" id="sell-category" required>
                  <option value="">Select category</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Condition</label>
                <select class="form-select" id="sell-condition">
                  <option value="new" ${editItem?.condition === 'new' ? 'selected' : ''}>New</option>
                  <option value="like_new" ${editItem?.condition === 'like_new' ? 'selected' : ''}>Like New</option>
                  <option value="excellent" ${editItem?.condition === 'excellent' ? 'selected' : ''}>Excellent</option>
                  <option value="good" ${editItem?.condition === 'good' ? 'selected' : ''}>Good</option>
                  <option value="used" ${editItem?.condition === 'used' || !editItem ? 'selected' : ''}>Used</option>
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Starting Price (₹)</label>
                <input type="number" class="form-input" id="sell-price" placeholder="100.00" step="0.01" min="0.01" required value="${editItem?.startPrice || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Buy Now Price (₹) <span style="color:var(--text-muted);text-transform:none;font-weight:400;">Optional</span></label>
                <input type="number" class="form-input" id="sell-buynow" placeholder="500.00" step="0.01" value="${editItem?.buyNowPrice || ''}">
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Auction Type</label>
                <select class="form-select" id="sell-type">
                  <option value="english" ${editItem?.auctionType === 'english' ? 'selected' : ''}>English (Ascending)</option>
                  <option value="dutch" ${editItem?.auctionType === 'dutch' ? 'selected' : ''}>Dutch (Descending)</option>
                  <option value="sealed" ${editItem?.auctionType === 'sealed' ? 'selected' : ''}>Sealed Bid</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">End Date & Time</label>
                <input type="datetime-local" class="form-input" id="sell-endtime" required value="${editItem?.endTime ? new Date(editItem.endTime).toISOString().slice(0, 16) : ''}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-input" id="sell-location" placeholder="City, State" value="${editItem?.location || App.user?.location || ''}">
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="sell-btn">
              ${isEdit ? '💾 Update Listing' : '🚀 Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    `;

    // Load categories
    this.loadCategories(editItem?.categoryId);

    // Image upload handling
    document.getElementById('sell-images').addEventListener('change', (e) => {
      this.handleImageUpload(e.target.files);
    });

    // Form submission
    document.getElementById('sell-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('sell-btn');
      btn.disabled = true;

      try {
        const formData = new FormData();
        formData.append('title', document.getElementById('sell-title').value);
        formData.append('description', document.getElementById('sell-desc').value);
        formData.append('categoryId', document.getElementById('sell-category').value);
        formData.append('condition', document.getElementById('sell-condition').value);
        formData.append('startPrice', document.getElementById('sell-price').value);
        formData.append('auctionType', document.getElementById('sell-type').value);
        formData.append('location', document.getElementById('sell-location').value);
        
        const buyNow = document.getElementById('sell-buynow').value;
        if (buyNow) formData.append('buyNowPrice', buyNow);

        const endTime = document.getElementById('sell-endtime').value;
        if (endTime) {
          formData.append('endTime', new Date(endTime).toISOString());
        }

        this.selectedImages.forEach(f => formData.append('images', f));

        let result;
        if (isEdit) {
          result = await fetch(`/api/items/${editItem.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
          }).then(r => r.json());
        } else {
          result = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
          }).then(r => r.json());
        }

        if (result.error) throw new Error(result.error);
        App.toast(isEdit ? 'Listing updated!' : 'Listing created! 🎉', 'success');
        App.navigate(`/item/${result.id}`);
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false;
      }
    });
  },

  async renderEditForm(container, itemId) {
    try {
      const item = await App.api(`/items/${itemId}`);
      if (item.sellerId !== App.user.id) {
        App.toast('Not authorized', 'error');
        return App.navigate('/');
      }
      this.renderSellForm(container, item);
    } catch (err) {
      App.toast(err.message, 'error');
      App.navigate('/my-listings');
    }
  },

  async loadCategories(selectedId) {
    try {
      const categories = await App.api('/categories');
      const select = document.getElementById('sell-category');
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.name}`;
        if (c.id === selectedId) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (e) { /* ignore */ }
  },

  handleImageUpload(files) {
    const previews = document.getElementById('image-previews');
    for (const file of files) {
      if (this.selectedImages.length >= 10) break;
      this.selectedImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const idx = this.selectedImages.length - 1;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <div class="image-preview-remove" onclick="ListingsPage.removeImage(${idx}, this.parentElement)">✕</div>
        `;
        previews.appendChild(div);
      };
      reader.readAsDataURL(file);
    }
  },

  removeImage(idx, el) {
    this.selectedImages.splice(idx, 1);
    el.remove();
  },

  async renderMyListings(container) {
    try {
      const data = await App.api(`/items?sellerId=${App.user.id}&status=`);
      container.innerHTML = `
        <div class="page-container container">
          <div class="section-header">
            <div>
              <h1 class="section-title">My Listings</h1>
              <p class="section-subtitle">${data.total} items listed</p>
            </div>
            <a href="#/sell" class="btn btn-primary">+ New Listing</a>
          </div>
          ${data.items.length > 0 ? `
            <div class="items-grid">
              ${data.items.map(item => App.itemCard(item)).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">📦</div>
              <div class="empty-state-title">No Listings Yet</div>
              <p class="empty-state-text">Start selling by creating your first listing</p>
              <a href="#/sell" class="btn btn-primary">Create Listing</a>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};
