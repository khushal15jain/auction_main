/* ============================================
   Messages Page
   ============================================ */
const MessagesPage = {
  currentPartner: null,

  async render(container, userId) {
    try {
      const convData = await App.api('/messages/conversations');

      container.innerHTML = `
        <div class="messages-layout">
          <div class="messages-sidebar">
            <div class="messages-sidebar-header">
              💬 Messages
              <span style="font-size:0.8rem;color:var(--text-muted);margin-left:0.5rem;">(${convData.length})</span>
            </div>
            <div id="conversations-list">
              ${convData.length > 0 ? convData.map(conv => `
                <div class="conversation-item ${userId === conv.partner.id ? 'active' : ''}"
                     onclick="MessagesPage.loadConversation('${conv.partner.id}')">
                  <div class="avatar avatar-sm">${conv.partner.avatar ? `<img src="${conv.partner.avatar}">` : conv.partner.name?.[0]}</div>
                  <div class="conversation-info">
                    <div class="conversation-name">
                      <span>${conv.partner.name}</span>
                      <span class="conversation-time">${App.timeAgo(conv.lastMessage.createdAt)}</span>
                    </div>
                    <div class="conversation-preview">${conv.lastMessage.content}</div>
                  </div>
                  ${conv.unreadCount > 0 ? `<div class="conversation-unread">${conv.unreadCount}</div>` : ''}
                </div>
              `).join('') : `
                <div style="padding:2rem;text-align:center;color:var(--text-muted);">
                  <p>No conversations yet</p>
                </div>
              `}
            </div>
          </div>

          <div class="messages-main" id="messages-main">
            ${userId ? '' : `
              <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
                <div style="text-align:center;">
                  <div style="font-size:3rem;margin-bottom:1rem;">💬</div>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            `}
          </div>
        </div>
      `;

      if (userId) {
        await this.loadConversation(userId);
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async loadConversation(userId) {
    this.currentPartner = userId;
    const main = document.getElementById('messages-main');

    try {
      const data = await App.api(`/messages/${userId}`);

      main.innerHTML = `
        <div class="messages-header">
          <div class="avatar avatar-sm">${data.partner?.avatar ? `<img src="${data.partner.avatar}">` : data.partner?.name?.[0]}</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem;">${data.partner?.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">Click to view profile</div>
          </div>
        </div>
        <div class="messages-body" id="messages-body">
          ${data.messages.map(msg => `
            <div class="message-bubble ${msg.senderId === App.user.id ? 'message-sent' : 'message-received'}">
              <div>${msg.content}</div>
              <div class="message-time">${App.timeAgo(msg.createdAt)}</div>
            </div>
          `).join('')}
        </div>
        <div class="messages-input">
          <input type="text" class="form-input" id="message-input" placeholder="Type a message..."
                 onkeydown="if(event.key==='Enter') MessagesPage.sendMessage()">
          <button class="btn btn-primary" onclick="MessagesPage.sendMessage()">Send</button>
        </div>
      `;

      // Scroll to bottom
      const body = document.getElementById('messages-body');
      body.scrollTop = body.scrollHeight;

      // Join Socket.io room
      if (App.socket) {
        const conversationId = [App.user.id, userId].sort().join('-');
        App.socket.emit('joinChat', conversationId);
        App.socket.off('newMessage');
        App.socket.on('newMessage', (msg) => {
          if (msg.senderId === userId || msg.senderId === App.user.id) {
            this.appendMessage(msg);
          }
        });
      }

      // Update badges
      App.updateBadges();

      // Highlight active conversation
      document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.conversation-item').forEach(el => {
        if (el.onclick?.toString().includes(userId)) el.classList.add('active');
      });

    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  async sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content || !this.currentPartner) return;

    try {
      input.value = '';
      await App.api('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId: this.currentPartner, content })
      });
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  appendMessage(msg) {
    const body = document.getElementById('messages-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = `message-bubble ${msg.senderId === App.user.id ? 'message-sent' : 'message-received'}`;
    div.innerHTML = `<div>${msg.content}</div><div class="message-time">just now</div>`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
};
