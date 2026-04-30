# Whispr — Anonymous Messaging App

A fully hosted, real-time anonymous messaging web application.  
No backend server required — powered by **Supabase** (free tier).

---

## Project Structure

```
whispr/
├── index.html              # Main HTML shell & all views
├── schema.sql              # Supabase database schema (run once)
├── README.md               # This file
│
├── css/
│   ├── reset.css           # CSS reset
│   ├── variables.css       # Design tokens (colors, spacing, fonts)
│   ├── base.css            # Global layout & utility styles
│   ├── components.css      # Reusable components (buttons, cards, modals…)
│   ├── views.css           # View-specific styles (hero, guest, features…)
│   └── animations.css      # Keyframe animations & transitions
│
└── js/
    ├── config.js           # ⚙️  YOUR SUPABASE CREDENTIALS GO HERE
    ├── db.js               # All database interactions (Supabase client)
    ├── ui.js               # Shared UI helpers (toast, copy, format…)
    ├── router.js           # Hash-based client-side router
    ├── app.js              # App bootstrap & entry point
    └── views/
        ├── home.js         # Home page interactions
        ├── setup.js        # Room creation flow
        ├── host.js         # Host dashboard (messages, share, export)
        └── guest.js        # Anonymous message submission
```

---

## Quick Start (5 minutes)

### 1. Create a Supabase project (free)

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in.
2. Click **New project** → choose a name, region, and password → **Create**.
3. Wait ~60 seconds for the project to provision.

### 2. Set up the database

1. In your Supabase dashboard, go to **SQL Editor** → **New query**.
2. Copy the entire contents of `schema.sql` and paste it in.
3. Click **Run** — you should see "Success. No rows returned."

### 3. Add your credentials

1. In Supabase, go to **Project Settings** → **API**.
2. Copy the **Project URL** and **anon public** key.
3. Open `js/config.js` and replace the placeholders:

```js
const SUPABASE_URL      = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR...';
```

### 4. Deploy / open

**Option A — Local (no server needed)**  
Just open `index.html` in a browser. Works as-is for testing.  
> ⚠️ Some browsers block ES modules from `file://`. Use a local server if needed: `npx serve .`

**Option B — Deploy to Netlify (free, 1 minute)**  
1. Create a free account at [netlify.com](https://netlify.com).
2. Drag the entire `whispr/` folder onto the Netlify dashboard.
3. Done — you get a live HTTPS URL.

**Option C — Deploy to Vercel**  
```bash
npx vercel
```

**Option D — GitHub Pages**  
Push to a GitHub repo, then enable Pages under Settings → Pages.

---

## How It Works

| Role | Flow |
|------|------|
| **Host** | Creates a room → gets a shareable link → views messages in real-time on the dashboard |
| **Guest** | Opens the shared link → types a message → submits anonymously (no account, no tracking) |

### URL scheme

| URL fragment | View |
|---|---|
| `#` (none) | Home page |
| `#room=<id>` | Guest / send-message view |
| `#host=<id>` | Host dashboard |

### Real-time

The host dashboard uses **Supabase Realtime** (WebSockets) so new messages appear instantly without needing to refresh.

---

## Features

- ✅ Anonymous messaging — zero identity stored
- ✅ Real-time message delivery (Supabase Realtime)
- ✅ Shareable link + room code
- ✅ Host dashboard with message management
- ✅ Delete individual messages or clear all
- ✅ Export messages to `.txt`
- ✅ Native share (Web Share API on mobile)
- ✅ Dark mode support
- ✅ Mobile responsive
- ✅ No authentication required for anyone

---

## Security Notes

- The Supabase **anon key** is safe to expose in the browser — it only has the permissions defined in Row Level Security (RLS) policies.
- RLS is enabled on both tables. Anonymous users can read rooms, insert messages, and delete messages. You can tighten this further in Supabase if needed.
- No IP addresses or identifying information is stored with messages.

---

## Customisation Tips

- **Change the accent color**: edit `--color-accent` in `css/variables.css`.
- **Change fonts**: edit the Google Fonts link in `index.html` and `--font-serif` / `--font-sans` in `variables.css`.
- **Add message reactions**: extend the `messages` table with a `reactions` JSONB column.
- **Password-protect rooms**: add a `password_hash` column to `rooms` and verify on the client.
