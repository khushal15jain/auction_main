/* ============================================
   Search / Explore Page
   ============================================ */
const SearchPage = {
  currentParams: null,

  async render(container, params) {
    this.currentParams = params;
    const q = params.get('q') || '';
    const category = params.get('category') || '';
    const sort = params.get('sort') || '';
    const page = params.get('page') || '1';

    try {
      const queryParts = [`page=${page}`, `limit=12`];
      if (q) queryParts.push(`q=${encodeURIComponent(q)}`);
      if (category) queryParts.push(`category=${category}`);
      if (sort) queryParts.push(`sort=${sort}`);

      const data = await App.api(`/search?${queryParts.join('&')}`);
      const categories = data.categories || [];

      container.innerHTML = `
        <div class="page-container container">
          <h1 class="section-title" style="margin-bottom:1.5rem;">
            ${q ? `Results for "${q}"` : 'Explore Auctions'}
            <span style="font-size:0.9rem;color:var(--text-muted);font-weight:400;"> — ${data.total} items</span>
          </h1>

          <div class="explore-layout">
            <!-- Filter Sidebar -->
            <div class="filter-sidebar">
              <div class="filter-section">
                <div class="filter-title">Search</div>
                <input type="text" class="form-input" id="explore-search" placeholder="Search items..." value="${q}" 
                       onkeydown="if(event.key==='Enter') SearchPage.applyFilter('q', this.value)">
              </div>

              <div class="filter-section">
                <div class="filter-title">Categories</div>
                <div class="filter-option ${!category ? 'active' : ''}" onclick="SearchPage.applyFilter('category', '')">
                  <span>All Categories</span>
                </div>
                ${categories.map(c => `
                  <div class="filter-option ${category === c.id ? 'active' : ''}" onclick="SearchPage.applyFilter('category', '${c.id}')">
                    <span>${c.icon} ${c.name}</span>
                    <span class="count" style="margin-left:auto;font-size:0.7rem;color:var(--text-muted);">${c._count?.items || 0}</span>
                  </div>
                `).join('')}
              </div>

              <div class="filter-section">
                <div class="filter-title">Sort By</div>
                ${[
                  ['', 'Latest'],
                  ['ending_soon', 'Ending Soon'],
                  ['price_asc', 'Price: Low to High'],
                  ['price_desc', 'Price: High to Low'],
                  ['most_bids', 'Most Bids']
                ].map(([val, label]) => `
                  <div class="filter-option ${sort === val ? 'active' : ''}" onclick="SearchPage.applyFilter('sort', '${val}')" style="color:${sort === val ? 'var(--accent-purple-light)' : ''}">
                    ${label}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Results -->
            <div>
              ${data.items.length > 0 ? `
                <div class="items-grid">
                  ${data.items.map(item => App.itemCard(item)).join('')}
                </div>
                ${App.paginationHTML(data.page, data.pages)}
              ` : `
                <div class="empty-state">
                  <div class="empty-state-icon">🔍</div>
                  <div class="empty-state-title">No Items Found</div>
                  <p class="empty-state-text">Try adjusting your filters or search terms</p>
                  <button class="btn btn-primary" onclick="App.navigate('/explore')">Clear Filters</button>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  applyFilter(key, value) {
    const params = this.currentParams || new URLSearchParams();
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // reset to page 1
    App.navigate(`/explore?${params.toString()}`);
  },

  goToPage(page) {
    const params = this.currentParams || new URLSearchParams();
    params.set('page', page);
    App.navigate(`/explore?${params.toString()}`);
  }
};
