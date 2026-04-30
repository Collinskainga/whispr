-- ════════════════════════════════════════════════════════════════
-- schema.sql  —  Whispr database schema for Supabase
--
-- Run this entire file in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- ════════════════════════════════════════════════════════════════


-- ── 1. ROOMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          TEXT        PRIMARY KEY,          -- short random ID (host shares this)
  name        TEXT        NOT NULL,             -- display name chosen by host
  welcome     TEXT,                             -- optional welcome message
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow anyone to read rooms (needed so guests can look up the room name)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a room"
  ON rooms FOR INSERT
  WITH CHECK (true);

-- Hosts cannot delete rooms via the API (optional — remove if you want)
-- CREATE POLICY "Anyone can delete a room"
--   ON rooms FOR DELETE
--   USING (true);


-- ── 2. MESSAGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  text        TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 800),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-room lookups
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages (room_id, created_at DESC);

-- Row-level security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert a message"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete a message"
  ON messages FOR DELETE
  USING (true);


-- ── 3. REALTIME ───────────────────────────────────────────────
-- Enable realtime publication for the messages table so the host
-- dashboard receives new messages instantly without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;


-- ── Done! ─────────────────────────────────────────────────────
-- Your Whispr database is ready.
-- Now fill in your project URL and anon key in js/config.js.
