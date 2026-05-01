# Kova — Private Messaging Platform

A WhatsApp-style 1-on-1 messaging web app with public accounts, real-time chat, and a polished dark UI. Powered by **Supabase** (free tier). No server required.

---

## Project Structure

```
kova/
├── index.html          # App shell (auth + chat UI)
├── schema.sql          # Supabase database schema — run once
├── README.md
│
├── css/
│   ├── reset.css
│   ├── variables.css   # All design tokens (colors, spacing, etc.)
│   ├── base.css        # Global styles, shared components
│   ├── auth.css        # Auth screen styles
│   ├── app.css         # Chat layout, sidebar, bubbles, composer
│   └── animations.css
│
└── js/
    ├── config.js       # ⚙️  YOUR SUPABASE CREDENTIALS GO HERE
    ├── db.js           # All Supabase auth + database calls
    ├── ui.js           # Shared UI helpers (toast, avatars, time)
    ├── auth.js         # Sign in / Sign up logic
    ├── chat.js         # Conversations + messaging logic
    └── app.js          # Entry point, auth state management
```

---

## Quick Setup (5 minutes)

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → sign up → **New project**
2. Wait ~60 seconds for it to provision

### 2. Run the database schema
1. In Supabase → **SQL Editor** → **New query**
2. Paste the contents of `schema.sql` → **Run**

### 3. Add your credentials
1. Supabase → **Project Settings** → **API**
2. Copy **Project URL** and **anon public** key
3. Open `js/config.js` and paste them:
```js
const SUPABASE_URL      = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGci...";
```

### 4. Enable Email Auth
- Supabase → **Authentication** → **Providers** → **Email** should be enabled by default.
- For local testing without email confirmation: **Auth** → **Settings** → disable "Enable email confirmations"

### 5. Deploy
- **Local**: `npx serve .` (or just open index.html in a browser)
- **Netlify**: Drag the `kova/` folder onto netlify.com — instant HTTPS URL
- **Vercel**: `npx vercel` from the kova directory

---

## Features

- ✅ Email sign up / sign in
- ✅ Auto-generated username & profile on sign up
- ✅ Search for other users by name or username
- ✅ Create 1-on-1 conversations instantly
- ✅ Real-time message delivery (Supabase Realtime)
- ✅ Grouped message bubbles (WhatsApp style)
- ✅ Date dividers in message history
- ✅ Conversation list with last message preview
- ✅ Coloured initials avatars
- ✅ Mobile responsive (sidebar slides in/out)
- ✅ Dark theme

---

## How It Works

| Role | Flow |
|------|------|
| **New user** | Signs up with email + display name → profile auto-created |
| **Finding someone** | Search bar in sidebar or "+" button → search by name/username |
| **Chatting** | Click a user → conversation opens → type and hit Enter or send button |
| **Real-time** | Messages appear instantly on both sides via Supabase Realtime WebSockets |

---

## Customisation

- **Accent color**: change `--kova-accent` in `css/variables.css`
- **Fonts**: edit the Google Fonts link in `index.html` and `--font-display` / `--font-body` in `variables.css`
- **Add read receipts**: use the `read_at` column already in the `messages` table
- **Add avatars/photos**: add a `avatar_url` column to `profiles` and use Supabase Storage
- **Add group chats**: extend `conversations` to support multiple participants
