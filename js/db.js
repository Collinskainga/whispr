/**
 * db.js — All database interactions via Supabase
 * Exposes a single `DB` object used by the rest of the app.
 */

(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__WHISPR_CONFIG__;

  // Initialise Supabase client (available via CDN global)
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /**
   * Generate a short random ID.
   * @param {number} len
   * @returns {string}
   */
  function genId(len = 10) {
    const bytes = crypto.getRandomValues(new Uint8Array(len));
    return [...bytes].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, len);
  }

  const DB = {
    supabase,

    /* ─────────────────────────────────────
       ROOMS
    ───────────────────────────────────── */

    /**
     * Create a new room.
     * @param {{ name: string, welcome: string }} opts
     * @returns {Promise<{ data: object|null, error: object|null }>}
     */
    async createRoom({ name, welcome }) {
      const id = genId(10);
      const { data, error } = await supabase
        .from('rooms')
        .insert({ id, name, welcome: welcome || null })
        .select()
        .single();
      return { data, error };
    },

    /**
     * Fetch a single room by its ID.
     * @param {string} id
     * @returns {Promise<{ data: object|null, error: object|null }>}
     */
    async getRoom(id) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    /**
     * Delete a room and all its messages (cascade handled by DB).
     * @param {string} id
     */
    async deleteRoom(id) {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      return { error };
    },

    /* ─────────────────────────────────────
       MESSAGES
    ───────────────────────────────────── */

    /**
     * Submit an anonymous message to a room.
     * @param {string} roomId
     * @param {string} text
     * @returns {Promise<{ data: object|null, error: object|null }>}
     */
    async sendMessage(roomId, text) {
      const { data, error } = await supabase
        .from('messages')
        .insert({ room_id: roomId, text })
        .select()
        .single();
      return { data, error };
    },

    /**
     * Fetch all messages for a room, newest first.
     * @param {string} roomId
     * @returns {Promise<{ data: object[]|null, error: object|null }>}
     */
    async getMessages(roomId) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    /**
     * Delete a single message by its ID.
     * @param {string} messageId
     */
    async deleteMessage(messageId) {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      return { error };
    },

    /**
     * Delete all messages in a room.
     * @param {string} roomId
     */
    async clearMessages(roomId) {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);
      return { error };
    },

    /**
     * Subscribe to real-time new messages for a room.
     * @param {string} roomId
     * @param {function} callback  Called with the new message row.
     * @returns Supabase RealtimeChannel (call .unsubscribe() to stop)
     */
    subscribeToMessages(roomId, callback) {
      return supabase
        .channel(`room-${roomId}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'messages',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => callback(payload.new)
        )
        .subscribe();
    },
  };

  window.DB = DB;
})();
