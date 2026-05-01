/**
 * db.js — All Supabase database & auth operations
 */
(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__KOVA_CONFIG__;
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const DB = {
    sb,

    // ── AUTH ────────────────────────────────────────────────────
    async signUp(email, password, displayName) {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return { data, error };
      // Update display name on the auto-created profile
      if (data.user) {
        await sb.from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.user.id);
      }
      return { data, error };
    },

    async signIn(email, password) {
      return await sb.auth.signInWithPassword({ email, password });
    },

    async signOut() {
      return await sb.auth.signOut();
    },

    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session;
    },

    onAuthChange(cb) {
      return sb.auth.onAuthStateChange((_event, session) => cb(session));
    },

    // ── PROFILES ────────────────────────────────────────────────
    async getProfile(userId) {
      const { data, error } = await sb.from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },

    async searchProfiles(query, excludeId) {
      const q = query.trim().toLowerCase();
      const { data, error } = await sb.from('profiles')
        .select('*')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq('id', excludeId)
        .limit(8);
      return { data, error };
    },

    // ── CONVERSATIONS ───────────────────────────────────────────
    async getOrCreateConversation(myId, theirId) {
      // Enforce user_a < user_b ordering
      const [user_a, user_b] = myId < theirId ? [myId, theirId] : [theirId, myId];

      // Try to get existing
      const { data: existing } = await sb.from('conversations')
        .select('*')
        .eq('user_a', user_a)
        .eq('user_b', user_b)
        .single();

      if (existing) return { data: existing, error: null };

      // Create new
      const { data, error } = await sb.from('conversations')
        .insert({ user_a, user_b })
        .select()
        .single();
      return { data, error };
    },

    async getMyConversations(myId) {
      const { data, error } = await sb.from('conversations')
        .select(`
          *,
          profile_a:profiles!conversations_user_a_fkey(id, display_name, username, avatar_color),
          profile_b:profiles!conversations_user_b_fkey(id, display_name, username, avatar_color)
        `)
        .or(`user_a.eq.${myId},user_b.eq.${myId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      return { data, error };
    },

    async updateConversationPreview(convId, text) {
      await sb.from('conversations')
        .update({ last_message: text, last_message_at: new Date().toISOString() })
        .eq('id', convId);
    },

    // ── MESSAGES ────────────────────────────────────────────────
    async getMessages(conversationId) {
      const { data, error } = await sb.from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return { data, error };
    },

    async sendMessage(conversationId, senderId, text) {
      const { data, error } = await sb.from('messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, text })
        .select()
        .single();
      return { data, error };
    },

    subscribeToMessages(conversationId, callback) {
      return sb.channel(`conv-${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, payload => callback(payload.new))
        .subscribe();
    },

    subscribeToConversations(myId, callback) {
      return sb.channel(`convs-${myId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        }, payload => callback(payload.new))
        .subscribe();
    },
  };

  window.DB = DB;
})();
