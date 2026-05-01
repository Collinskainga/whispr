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

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create a room" ON rooms;
CREATE POLICY "Anyone can create a room"
  ON rooms FOR INSERT
  WITH CHECK (true);


-- ── 2. MESSAGES ───────────────────────────────────────────────
-- Ensure pgcrypto exists for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  text        TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 800),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-room lookups
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages (room_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert a message" ON messages;
CREATE POLICY "Anyone can insert a message"
  ON messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete a message" ON messages;
CREATE POLICY "Anyone can delete a message"
  ON messages FOR DELETE
  USING (true);


-- ── 3. REALTIME (Postgres Changes) ─────────────────────────────
-- Make sure the publication exists before adding the table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Table add may error if it's already present; handle safely
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    EXCEPTION
      WHEN duplicate_object THEN
        -- already added; ignore
        NULL;
    END;
  ELSE
    -- If publication doesn't exist (rare), create it then add the table
    CREATE PUBLICATION supabase_realtime;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;


-- ── Done! ─────────────────────────────────────────────────────
-- Your Whispr database is ready.
-- Now fill in your project URL and anon key in js/config.js.
