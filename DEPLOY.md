# RepRally — Complete Deployment Guide
## From zero to live URL in ~20 minutes

---

## WHAT YOU'LL END UP WITH
- A live URL like `https://reprally.vercel.app` (or your custom name)
- Sanjay, Arun, Karthi, and Sethu can sign up and start logging
- You (admin) control who gets access
- No monthly cost for this group size

---

## STEP 1 — Create a Supabase Account (your database)

1. Go to **https://supabase.com** → click "Start your project"
2. Sign up with GitHub or email (free)
3. Click **"New Project"**
   - Organization: your name
   - Project name: `reprally`
   - Database password: choose something strong and **save it**
   - Region: pick the closest to you (e.g. US East or Canada)
4. Wait ~2 minutes for the project to spin up

---

## STEP 2 — Set Up the Database

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase_schema.sql` from this folder
4. **Copy the entire contents** and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success. No rows returned"

---

## STEP 3 — Get Your API Keys

1. In Supabase, click **"Project Settings"** (gear icon, bottom left)
2. Click **"API"**
3. Copy two values:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon / public key** → long string starting with `eyJ...`
4. Keep these handy for Step 5

---

## STEP 4 — Create a GitHub Account + Upload the Code

1. Go to **https://github.com** → Sign up (free)
2. Click **"New repository"**
   - Name: `reprally`
   - Keep it **Public** (required for free Vercel hosting)
   - Click "Create repository"
3. On your computer, open Terminal (Mac) or Command Prompt (Windows)
4. Run these commands one by one:

```bash
cd path/to/reprally-folder    # navigate to the reprally folder
git init
git add .
git commit -m "Initial RepRally build"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/reprally.git
git push -u origin main
```

(Replace YOUR-USERNAME with your GitHub username)

---

## STEP 5 — Deploy on Vercel (your live URL)

1. Go to **https://vercel.com** → Sign up with your GitHub account
2. Click **"Add New Project"**
3. Find and import your `reprally` repository
4. Before clicking Deploy, click **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Project URL from Step 3 |
   | `VITE_SUPABASE_ANON_KEY` | your anon key from Step 3 |

5. Click **"Deploy"**
6. Wait ~60 seconds → Vercel gives you a URL like `reprally.vercel.app`

---

## STEP 6 — Create Your Admin Account

1. Open your live URL (e.g. `https://reprally.vercel.app`)
2. Click "Signup" and create an account with **your** email
3. Go back to **Supabase → SQL Editor → New Query** and run:

```sql
UPDATE public.profiles
SET is_admin = true, approved = true
WHERE email = 'your-email@example.com';
```

(Replace with your actual email)

4. Refresh the app — you'll now see the Admin Panel

---

## STEP 7 — Invite Sanjay, Arun, Karthi, and Sethu

**Option A — Share the link (easiest)**
Just send them: `https://reprally.vercel.app`
They click Signup, create their account, pick their group.
You'll see them in Admin → Users → click APPROVE to grant access.

**Option B — Pre-approve by email**
If you know their emails in advance, run in Supabase SQL:
```sql
UPDATE public.profiles
SET approved = true
WHERE email IN (
  'sanjay@email.com',
  'arun@email.com',
  'karthi@email.com',
  'sethu@email.com'
);
```

---

## STEP 8 — Optional: Custom URL

Instead of `reprally.vercel.app` you can get a free subdomain:
1. In Vercel → your project → Settings → Domains
2. Type something like `reprally-crew` → Vercel gives you `reprally-crew.vercel.app`
No domain purchase needed!

If you ever want a proper domain like `reprally.com`, you can buy one from
Namecheap (~$10/year) and connect it in Vercel Settings → Domains.

---

## ADMIN CAPABILITIES SUMMARY

Once you're logged in as admin you can:
- ✅ Approve or revoke access for any user
- ✅ See all logs across all groups
- ✅ Delete any incorrect log entry
- ✅ View challenge overview & group stats
- ✅ Copy and share the invite link
- ✅ Send email invites (once Supabase SMTP is configured)

---

## TROUBLESHOOTING

**"Error: Missing Supabase URL"** — Make sure you added the environment variables in Vercel (Step 5) and redeployed.

**User can log in but sees a blank screen** — Their profile may not be approved yet. Go to Admin → Users → Approve.

**"Permission denied" errors in logs** — The SQL schema sets up Row Level Security. Make sure you ran the full schema file.

**App not updating after code changes** — Push to GitHub again; Vercel auto-deploys on every push.

---

## FILE STRUCTURE (for reference)

```
reprally/
├── index.html                  ← Entry point
├── package.json                ← Dependencies
├── vite.config.js              ← Build config
├── .env.example                ← Copy to .env.local for local dev
├── supabase_schema.sql         ← Run once in Supabase SQL Editor
└── src/
    ├── main.jsx                ← React bootstrap
    ├── App.jsx                 ← Root (auth routing)
    ├── supabaseClient.js       ← DB connection
    ├── groups.js               ← All group/exercise definitions
    ├── screens/
    │   ├── AuthScreen.jsx      ← Login / Signup
    │   ├── EnrollScreen.jsx    ← Pick your group
    │   ├── Dashboard.jsx       ← Main user view
    │   └── AdminPanel.jsx      ← Admin controls
    └── components/
        └── LogModal.jsx        ← Log workout bottom sheet
```
