/* ============================================
   Auth Pages (Login & Register)
   ============================================ */
const AuthPage = {
  renderLogin(container) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div style="text-align:center;margin-bottom:1rem;">
            <span class="logo-icon" style="font-size:2rem;">◆</span>
          </div>
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to your AuctionVerse account</p>
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-btn">Sign In</button>
          </form>
          <div class="auth-divider">or</div>
          <p class="form-hint" style="text-align:center;margin-bottom:0.75rem;color:var(--text-muted);">
            Demo: demo@example.com / password123
          </p>
          <div class="auth-footer">
            Don't have an account? <a href="#/register">Create one</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.textContent = 'Signing in...';
      try {
        const data = await App.api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
          })
        });
        App.setAuth(data.token, data.user);
        App.toast('Welcome back! 👋', 'success');
        App.navigate('/');
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  },

  renderRegister(container) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div style="text-align:center;margin-bottom:1rem;">
            <span class="logo-icon" style="font-size:2rem;">◆</span>
          </div>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join AuctionVerse and start your journey</p>
          <form id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name</label>
              <input type="text" id="reg-name" class="form-input" placeholder="John Doe" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <input type="password" id="reg-password" class="form-input" placeholder="Min. 6 characters" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-location">Location (Optional)</label>
              <input type="text" id="reg-location" class="form-input" placeholder="City, State">
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="register-btn">Create Account</button>
          </form>
          <div class="auth-footer">
            Already have an account? <a href="#/login">Sign in</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.textContent = 'Creating account...';
      try {
        const data = await App.api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            location: document.getElementById('reg-location').value
          })
        });
        App.setAuth(data.token, data.user);
        App.toast('Account created! Welcome to AuctionVerse! 🎉', 'success');
        App.navigate('/');
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
};
