# Genedge Solar PMS — Complete Deployment Guide
## Supabase (Database) + Vercel (Hosting)

---

## OVERVIEW

```
Your React code (local PC)
        ↓  push to GitHub
   GitHub Repository
        ↓  auto-deploy
   Vercel (live website)
        ↓  reads/writes data
   Supabase (PostgreSQL database + Auth)
```

**Live URL after deployment:** `https://genedge-solar-pms.vercel.app`
**All users access via browser** — no app installation needed anywhere.

---

## PART 1 — SUPABASE SETUP (Database + Auth)

### Step 1.1 — Create Supabase Account
1. Go to **https://supabase.com**
2. Click **Start your project** → Sign up with GitHub or email
3. Click **New Project**
4. Fill in:
   - **Organization:** Genedge Renewable (or your name)
   - **Project name:** `genedge-solar-pms`
   - **Database Password:** Create a strong password — **save this somewhere safe**
   - **Region:** Singapore (closest to Gujarat)
5. Click **Create new project**
6. Wait ~2 minutes for the project to spin up

---

### Step 1.2 — Run the Database Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase_schema.sql` from this project folder
4. **Copy the entire contents** and paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see: `Success. No rows returned`
7. Verify: click **Table Editor** in sidebar — you should see `profiles`, `dprs`, `inventory` tables

---

### Step 1.3 — Get Your API Keys

1. In Supabase, click **Project Settings** (gear icon, bottom left)
2. Click **API** in the settings menu
3. Copy these two values — you will need them later:

```
Project URL:   https://xxxxxxxxxxxx.supabase.co
anon public:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxx
```

> ⚠️ The `anon` key is safe to use in frontend code — RLS policies protect your data.
> Never use the `service_role` key in frontend code.

---

### Step 1.4 — Create User Accounts

You create users in Supabase Auth, then set their role and site in the profiles table.

#### Create each user:
1. Go to **Authentication** → **Users** in Supabase sidebar
2. Click **Invite user** (or **Add user** → **Create new user**)
3. Enter email and a temporary password
4. Repeat for all users

**Suggested user accounts for Junagadh cluster:**

| Full Name              | Email                          | Password      | Role   | Site         |
|------------------------|--------------------------------|---------------|--------|--------------|
| Er. Ramesh Patel       | devki.site@genedge.in          | Site@123      | site   | Devkigalol   |
| Er. Suresh Modi        | kanja.site@genedge.in          | Site@123      | site   | Kanja        |
| Er. Mahesh Shah        | mendapara.site@genedge.in      | Site@123      | site   | Mendapara    |
| Er. Dinesh Trivedi     | mandodara.site@genedge.in      | Site@123      | site   | Mandodara    |
| Admin Genedge          | admin@genedge.in               | Admin@2026    | office | (leave null) |

> Change passwords to something strong before sharing with the team.

#### Set role and site for each user:
After creating each user, go to **SQL Editor** and run (replace values for each user):

```sql
-- Run once per user. Get the UUID from Authentication → Users list.

UPDATE public.profiles
SET
  full_name = 'Er. Ramesh Patel',
  role      = 'site',
  site      = 'Devkigalol'
WHERE email = 'devki.site@genedge.in';

UPDATE public.profiles
SET
  full_name = 'Er. Suresh Modi',
  role      = 'site',
  site      = 'Kanja'
WHERE email = 'kanja.site@genedge.in';

UPDATE public.profiles
SET
  full_name = 'Er. Mahesh Shah',
  role      = 'site',
  site      = 'Mendapara'
WHERE email = 'mendapara.site@genedge.in';

UPDATE public.profiles
SET
  full_name = 'Er. Dinesh Trivedi',
  role      = 'site',
  site      = 'Mandodara'
WHERE email = 'mandodara.site@genedge.in';

UPDATE public.profiles
SET
  full_name = 'Admin Genedge',
  role      = 'office',
  site      = NULL
WHERE email = 'admin@genedge.in';
```

#### Verify profiles are set correctly:
```sql
SELECT id, email, full_name, role, site FROM public.profiles;
```

---

### Step 1.5 — Configure Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://genedge-solar-pms.vercel.app`
   (You can change this after Vercel deployment)
3. Under **Redirect URLs**, add: `https://genedge-solar-pms.vercel.app/**`
4. Go to **Authentication** → **Email Templates**
5. Optionally customise the invite email with Genedge branding
6. Click **Save**

---

## PART 2 — GITHUB SETUP

### Step 2.1 — Create a GitHub Account (if needed)
Go to **https://github.com** and sign up (free).

### Step 2.2 — Create a New Repository
1. Click **+** (top right) → **New repository**
2. Repository name: `genedge-solar-pms`
3. Set to **Private** (important — do not make this public)
4. Click **Create repository**

### Step 2.3 — Push Your Code to GitHub

Open Terminal / Command Prompt in the `solar-pms` project folder and run:

```bash
# Install dependencies first (do this once)
npm install

# Initialise git and push to GitHub
git init
git add .
git commit -m "Initial commit — Genedge Solar PMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/genedge-solar-pms.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username.

---

## PART 3 — VERCEL DEPLOYMENT (Hosting)

### Step 3.1 — Create Vercel Account
1. Go to **https://vercel.com**
2. Click **Sign Up** → **Continue with GitHub** (use the same GitHub account)
3. Authorise Vercel to access your GitHub

### Step 3.2 — Import Project
1. On Vercel dashboard, click **Add New** → **Project**
2. Find `genedge-solar-pms` in the list → click **Import**
3. Vercel auto-detects it as a React app (Create React App)
4. Leave **Framework Preset** as `Create React App`
5. Leave **Root Directory** as `.`
6. **DO NOT click Deploy yet** — add environment variables first

### Step 3.3 — Add Environment Variables (CRITICAL)
1. Scroll down to **Environment Variables** section
2. Add these two variables:

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` (your URL from Step 1.3) |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (your anon key from Step 1.3) |

3. Click **Add** after entering each variable
4. Now click **Deploy**
5. Wait ~2 minutes for the build to complete

### Step 3.4 — Get Your Live URL
After deploy succeeds, Vercel gives you a URL like:
`https://genedge-solar-pms.vercel.app`

> Copy this URL and update it in Supabase Auth settings (Step 1.5).

---

## PART 4 — FUTURE CODE UPDATES

Whenever you change the code:

```bash
git add .
git commit -m "Description of what you changed"
git push
```

Vercel automatically re-deploys within 1–2 minutes. No manual steps needed.

---

## PART 5 — LOCAL DEVELOPMENT (for testing on your PC)

### Step 5.1 — Create .env file
In the `solar-pms` folder, create a file named `.env` (not `.env.example`):

```
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Step 5.2 — Run locally
```bash
npm install    # only needed once
npm start      # opens http://localhost:3000
```

> ⚠️ Never commit the `.env` file to GitHub. The `.gitignore` already excludes it.

---

## PART 6 — USER MANAGEMENT (ongoing)

### To add a new site user later:
1. Go to Supabase → **Authentication** → **Users** → **Invite user**
2. Enter their email, set a password
3. Run SQL to set their profile:
```sql
UPDATE public.profiles
SET full_name = 'Name Here', role = 'site', site = 'Devkigalol'
WHERE email = 'newuser@genedge.in';
```

### To reset a user's password:
1. Supabase → **Authentication** → **Users**
2. Click the user → **Send Password Reset** (sends email)
OR directly set: click **...** menu → **Reset password**

### To deactivate a user:
1. Supabase → **Authentication** → **Users**
2. Click the user → **Ban user** (they cannot log in anymore)

---

## QUICK REFERENCE

| What | Where |
|------|-------|
| Database & Auth | https://supabase.com → your project |
| Live App URL | https://genedge-solar-pms.vercel.app |
| Deployment | https://vercel.com → your project |
| Code repo | https://github.com/YOUR_USERNAME/genedge-solar-pms |
| Add/manage users | Supabase → Authentication → Users |
| View all DPR data | Supabase → Table Editor → dprs |
| View inventory | Supabase → Table Editor → inventory |

---

## ROLE PERMISSIONS SUMMARY

| Feature | Site User | Office Admin |
|---------|-----------|--------------|
| Submit DPR | ✅ Own site only | ✅ Any site |
| View DPR records | ✅ Own site only | ✅ All sites |
| Dashboard | ❌ | ✅ |
| Manpower module | ❌ | ✅ |
| Inventory module | ❌ | ✅ |
| Issues / NCR | ❌ | ✅ |
| Reports + Export | ❌ | ✅ |

> These restrictions are enforced at **three levels:**
> 1. Sidebar navigation (site users only see DPR items)
> 2. React component guard (page renders access-denied if wrong role)
> 3. Supabase Row Level Security (database rejects unauthorized queries)

---

## TROUBLESHOOTING

**"Invalid API key" error on login:**
→ Check that REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are correctly set in Vercel environment variables. Redeploy after adding them.

**User can log in but sees no data / blank dashboard:**
→ Check the profiles table. The user's `role` and `site` may not be set. Run the UPDATE SQL from Step 1.4.

**DPR submitted but dashboard doesn't update:**
→ Refresh the page. Data is fetched on page load. Real-time sync can be added later using Supabase Realtime.

**Build fails on Vercel:**
→ Check the build log. Most common issue is missing environment variables. Ensure both REACT_APP_ vars are set.

**"new row violates row-level security policy" error:**
→ The user's profile role/site is not set correctly. Run Step 1.4 SQL again.
