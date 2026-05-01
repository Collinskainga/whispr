/**
 * config.js — Supabase project configuration
 *
 * HOW TO SET UP (free, takes ~3 minutes):
 * ─────────────────────────────────────────
 * 1. Go to https://supabase.com and create a free account.
 * 2. Click "New project", give it a name, choose a region, set a password.
 * 3. Wait ~1 minute for the project to spin up.
 * 4. Go to Project Settings → API.
 * 5. Copy "Project URL"  → paste as SUPABASE_URL below.
 * 6. Copy "anon public"  → paste as SUPABASE_ANON_KEY below.
 * 7. Go to the SQL Editor and run the schema in schema.sql to create the tables.
 * 8. Open index.html in a browser (or deploy to any static host).
 */

const SUPABASE_URL = "https://zvzfwytqubfemccbbtre.supabase.co"; // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_gg5Eke1rGU5P-BrVSSTHOw_Z3dNSMUu"; // long JWT string

/* ── Do not edit below this line ── */
window.__WHISPR_CONFIG__ = { SUPABASE_URL, SUPABASE_ANON_KEY };
