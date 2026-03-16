/* ============================================
   Ratings Component
   ============================================ */
const RatingsComponent = {
  selectedRating: 0,

  async loadItemReviews(itemId, sellerId) {
    const reviewsContainer = document.getElementById('item-reviews');
    if (!reviewsContainer) return;

    try {
      const data = await App.api(`/ratings/item/${itemId}`);

      let rateSection = '';
      if (App.user && App.user.id !== sellerId) {
        rateSection = `
          <div class="review-card" style="background:var(--bg-hover);border:1px dashed var(--border-accent);">
            <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:0.75rem;">Leave a Review</h4>
            <div style="margin-bottom:0.75rem;" id="rating-stars">
              ${App.starsHTML(0, true)}
            </div>
            <input type="hidden" id="rating-value" value="0">
            <textarea class="form-textarea" id="rating-comment" placeholder="Share your experience..." style="min-height:80px;margin-bottom:0.75rem;"></textarea>
            <button class="btn btn-primary btn-sm" onclick="RatingsComponent.submitRating('${itemId}', '${sellerId}')">Submit Review</button>
          </div>
        `;
      }

      reviewsContainer.innerHTML = `
        ${rateSection}
        ${data.ratings.length > 0 ? `
          <div style="margin-bottom:1rem;">
            <span style="font-size:1.5rem;font-weight:800;">${data.average.toFixed(1)}</span>
            <span style="color:var(--text-muted);font-size:0.85rem;"> / 5 from ${data.count} review${data.count !== 1 ? 's' : ''}</span>
            <div style="margin-top:0.25rem;">${App.starsHTML(Math.round(data.average))}</div>
          </div>
          ${data.ratings.map(r => `
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
          `).join('')}
        ` : '<p style="color:var(--text-muted);font-size:0.85rem;">No reviews yet. Be the first to review!</p>'}
      `;
    } catch (err) {
      reviewsContainer.innerHTML = '<p style="color:var(--text-muted);">Could not load reviews</p>';
    }
  },

  setRating(score) {
    this.selectedRating = score;
    const input = document.getElementById('rating-value');
    if (input) input.value = score;

    const stars = document.querySelectorAll('#rating-stars .star');
    stars.forEach((star, i) => {
      star.classList.toggle('filled', i < score);
    });
  },

  async submitRating(itemId, ratedUserId) {
    const score = this.selectedRating || parseInt(document.getElementById('rating-value')?.value || '0');
    const comment = document.getElementById('rating-comment')?.value?.trim();

    if (!score || score < 1) return App.toast('Please select a rating', 'error');

    try {
      await App.api('/ratings', {
        method: 'POST',
        body: JSON.stringify({ ratedUserId, itemId, score, comment })
      });
      App.toast('Review submitted! ⭐', 'success');
      this.loadItemReviews(itemId, ratedUserId);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};
