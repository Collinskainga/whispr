/**
 * chat.js — Conversations sidebar + message view
 */
(function () {
  let myProfile = null;
  let activeConvId = null;
  let allConvs = [];
  let msgChannel = null;
  let convChannel = null;
  let searchDebounce = null;
  let modalDebounce = null;

  // ── Init ──────────────────────────────────────────────────
  function init(profile) {
    myProfile = profile;
    renderMe();
    loadConversations();
    setupSearch();
    setupComposer();
    setupModal();

    document.getElementById('btn-signout').addEventListener('click', async () => {
      await DB.signOut();
    });

    document.getElementById('btn-back').addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
      showWelcome();
    });

    // Subscribe to conversation list updates
    convChannel = DB.subscribeToConversations(myProfile.id, (updated) => {
      const idx = allConvs.findIndex(c => c.id === updated.id);
      if (idx !== -1) {
        allConvs[idx] = { ...allConvs[idx], ...updated };
        // Move to top
        const [conv] = allConvs.splice(idx, 1);
        allConvs.unshift(conv);
        renderConvList();
      }
    });
  }

  // ── Render sidebar "me" ───────────────────────────────────
  function renderMe() {
    UI.setAvatar(document.getElementById('me-avatar'), myProfile.display_name);
    document.getElementById('me-name').textContent = myProfile.display_name;
    document.getElementById('me-handle').textContent = '@' + myProfile.username;
  }

  // ── Conversations ─────────────────────────────────────────
  async function loadConversations() {
    const { data, error } = await DB.getMyConversations(myProfile.id);
    if (error) { UI.toast('Could not load conversations', 'error'); return; }
    allConvs = data || [];
    renderConvList();
  }

  function renderConvList() {
    const list = document.getElementById('conv-list');
    if (!allConvs.length) {
      list.innerHTML = '<div class="conv-list__empty"><p>No conversations yet.</p><p>Search for someone to start chatting.</p></div>';
      return;
    }
    list.innerHTML = allConvs.map(conv => {
      const other = conv.user_a === myProfile.id ? conv.profile_b : conv.profile_a;
      const preview = conv.last_message ? conv.last_message.slice(0, 45) + (conv.last_message.length > 45 ? '…' : '') : 'No messages yet';
      const timeStr = UI.formatConvTime(conv.last_message_at);
      const isActive = conv.id === activeConvId;
      const color = UI.getAvatarColor(other.display_name);
      const initials = UI.avatarInitials(other.display_name);
      return `
        <div class="conv-item${isActive ? ' active' : ''}" data-conv-id="${conv.id}" data-other-id="${other.id}">
          <div class="avatar" style="background:${color}">${initials}</div>
          <div class="conv-item__body">
            <div class="conv-item__top">
              <span class="conv-item__name">${UI.escapeHtml(other.display_name)}</span>
              <span class="conv-item__time">${timeStr}</span>
            </div>
            <div class="conv-item__preview">${UI.escapeHtml(preview)}</div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.conv-item').forEach(item => {
      item.addEventListener('click', () => openConversation(item.dataset.convId, item.dataset.otherId));
    });
  }

  // ── Open a conversation ───────────────────────────────────
  async function openConversation(convId, otherId) {
    // On mobile, close sidebar
    document.getElementById('sidebar').classList.remove('open');

    activeConvId = convId;
    renderConvList(); // update active highlight

    // Unsubscribe from previous channel
    if (msgChannel) { msgChannel.unsubscribe(); msgChannel = null; }

    // Show chat view
    document.getElementById('chat-welcome').classList.add('hidden');
    const chatView = document.getElementById('chat-view');
    chatView.classList.remove('hidden');

    // Fetch the "other" profile
    const { data: other } = await DB.getProfile(otherId);
    if (!other) return;

    // Set header
    const headerAvatar = document.getElementById('chat-avatar');
    headerAvatar.style.background = UI.getAvatarColor(other.display_name);
    headerAvatar.textContent = UI.avatarInitials(other.display_name);
    document.getElementById('chat-name').textContent = other.display_name;
    document.getElementById('chat-handle').textContent = '@' + other.username;

    // Load messages
    const messagesArea = document.getElementById('messages-area');
    messagesArea.innerHTML = '<div class="messages-loading"><div class="spinner"></div></div>';

    const { data: messages } = await DB.getMessages(convId);
    renderMessages(messages || []);

    // Focus composer
    document.getElementById('msg-input').focus();

    // Subscribe to new messages
    msgChannel = DB.subscribeToMessages(convId, (newMsg) => {
      appendMessage(newMsg);
      scrollToBottom();
    });
  }

  // ── Render messages ───────────────────────────────────────
  function renderMessages(messages) {
    const area = document.getElementById('messages-area');
    if (!messages.length) {
      area.innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);font-size:0.85rem;">No messages yet. Say hello! 👋</div>';
      return;
    }

    let html = '';
    let lastDate = null;
    let lastSender = null;

    messages.forEach((msg, i) => {
      const dateStr = UI.formatDate(msg.created_at);
      if (dateStr !== lastDate) {
        if (lastDate !== null) html += '</div>'; // close previous group
        html += `<div class="msg-day-divider"><span>${dateStr}</span></div>`;
        lastDate = dateStr;
        lastSender = null;
      }

      const isMe = msg.sender_id === myProfile.id;
      const groupClass = isMe ? 'msg-group--me' : 'msg-group--them';

      if (msg.sender_id !== lastSender) {
        if (lastSender !== null) html += '</div>';
        html += `<div class="msg-group ${groupClass}">`;
        lastSender = msg.sender_id;
      }

      html += `<div class="msg-bubble">${UI.escapeHtml(msg.text)}</div>`;

      // Add time on last message of a group or last overall
      const isLast = i === messages.length - 1 || messages[i+1]?.sender_id !== msg.sender_id;
      if (isLast) {
        html += `<span class="msg-time">${UI.formatTime(msg.created_at)}</span>`;
      }
    });

    if (lastSender !== null) html += '</div>';
    area.innerHTML = html;
    scrollToBottom(false);
  }

  function appendMessage(msg) {
    const area = document.getElementById('messages-area');
    const isMe = msg.sender_id === myProfile.id;
    const groupClass = isMe ? 'msg-group--me' : 'msg-group--them';

    // Check if we can append to existing group
    const lastGroup = area.querySelector('.msg-group:last-of-type');
    if (lastGroup && lastGroup.classList.contains(groupClass)) {
      // Remove last time span and re-add after new bubble
      const lastTime = lastGroup.querySelector('.msg-time:last-child');
      if (lastTime) lastGroup.removeChild(lastTime);
      lastGroup.insertAdjacentHTML('beforeend',
        `<div class="msg-bubble">${UI.escapeHtml(msg.text)}</div>
         <span class="msg-time">${UI.formatTime(msg.created_at)}</span>`
      );
    } else {
      area.insertAdjacentHTML('beforeend', `
        <div class="msg-group ${groupClass}">
          <div class="msg-bubble">${UI.escapeHtml(msg.text)}</div>
          <span class="msg-time">${UI.formatTime(msg.created_at)}</span>
        </div>
      `);
    }
  }

  function scrollToBottom(smooth = true) {
    const area = document.getElementById('messages-area');
    area.scrollTo({ top: area.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }

  // ── Composer ──────────────────────────────────────────────
  function setupComposer() {
    const input = document.getElementById('msg-input');
    const sendBtn = document.getElementById('btn-send');

    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
      // Auto-grow
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });

    sendBtn.addEventListener('click', doSend);
  }

  async function doSend() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || !activeConvId) return;

    input.value = '';
    input.style.height = '';
    document.getElementById('btn-send').disabled = true;

    const { data, error } = await DB.sendMessage(activeConvId, myProfile.id, text);
    if (error) { UI.toast('Could not send message', 'error'); return; }

    // Optimistically append (realtime will also fire but appendMessage handles deduplication via the channel)
    appendMessage(data);
    scrollToBottom();

    // Update conversation preview
    await DB.updateConversationPreview(activeConvId, text);
    loadConversations();
  }

  // ── Sidebar search ────────────────────────────────────────
  function setupSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    input.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      const q = input.value.trim();
      if (!q) { results.classList.add('hidden'); results.innerHTML = ''; return; }
      searchDebounce = setTimeout(() => doSearch(q, results), 280);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { results.classList.add('hidden'); }, 200);
    });
  }

  async function doSearch(q, container) {
    const { data } = await DB.searchProfiles(q, myProfile.id);
    if (!data?.length) {
      container.innerHTML = '<div style="padding:0.75rem 1rem;font-size:0.82rem;color:var(--text-muted);">No users found</div>';
      container.classList.remove('hidden');
      return;
    }
    container.innerHTML = data.map(p => `
      <div class="search-result-item" data-id="${p.id}">
        <div class="avatar" style="background:${UI.getAvatarColor(p.display_name)}">${UI.avatarInitials(p.display_name)}</div>
        <div class="search-result-item__info">
          <div class="search-result-item__name">${UI.escapeHtml(p.display_name)}</div>
          <div class="search-result-item__handle">@${p.username}</div>
        </div>
      </div>
    `).join('');
    container.classList.remove('hidden');

    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', async () => {
        container.classList.add('hidden');
        document.getElementById('search-input').value = '';
        await startChatWith(item.dataset.id);
      });
    });
  }

  // ── New chat modal ────────────────────────────────────────
  function setupModal() {
    document.getElementById('btn-new-chat').addEventListener('click', () => {
      document.getElementById('modal-new-chat').classList.add('open');
      document.getElementById('modal-search').focus();
    });
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('modal-new-chat').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-new-chat')) closeModal();
    });

    const input = document.getElementById('modal-search');
    input.addEventListener('input', () => {
      clearTimeout(modalDebounce);
      const q = input.value.trim();
      if (!q) {
        document.getElementById('modal-results').innerHTML = '<p class="modal-results__hint">Type to search for people</p>';
        return;
      }
      modalDebounce = setTimeout(() => doModalSearch(q), 280);
    });
  }

  function closeModal() {
    document.getElementById('modal-new-chat').classList.remove('open');
    document.getElementById('modal-search').value = '';
    document.getElementById('modal-results').innerHTML = '<p class="modal-results__hint">Type to search for people</p>';
  }

  async function doModalSearch(q) {
    const container = document.getElementById('modal-results');
    container.innerHTML = '<div style="display:flex;justify-content:center;padding:1rem"><div class="spinner"></div></div>';
    const { data } = await DB.searchProfiles(q, myProfile.id);
    if (!data?.length) {
      container.innerHTML = '<p class="modal-results__hint">No users found</p>';
      return;
    }
    container.innerHTML = data.map(p => `
      <div class="modal-result-item" data-id="${p.id}">
        <div class="avatar" style="background:${UI.getAvatarColor(p.display_name)}">${UI.avatarInitials(p.display_name)}</div>
        <div class="modal-result-item__info">
          <div class="modal-result-item__name">${UI.escapeHtml(p.display_name)}</div>
          <div class="modal-result-item__handle">@${p.username}</div>
        </div>
        <span class="modal-result-item__action">Message</span>
      </div>
    `).join('');

    container.querySelectorAll('.modal-result-item').forEach(item => {
      item.addEventListener('click', async () => {
        closeModal();
        await startChatWith(item.dataset.id);
      });
    });
  }

  async function startChatWith(userId) {
    const { data: conv, error } = await DB.getOrCreateConversation(myProfile.id, userId);
    if (error || !conv) { UI.toast('Could not open conversation', 'error'); return; }
    await loadConversations();
    await openConversation(conv.id, userId);
  }

  function showWelcome() {
    activeConvId = null;
    document.getElementById('chat-welcome').classList.remove('hidden');
    document.getElementById('chat-view').classList.add('hidden');
    if (msgChannel) { msgChannel.unsubscribe(); msgChannel = null; }
    renderConvList();
  }

  window.Chat = { init };
})();
