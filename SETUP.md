# Tindahan POS — Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [Supabase Setup](#1-supabase-setup)
4. [Local Development](#2-local-development)
5. [Vercel Deployment](#3-vercel-deployment)
6. [Environment Variables](#4-environment-variables)
7. [Credentials](#5-credentials)

---

## Project Overview

A full-stack POS (Point of Sale) and Inventory Management System built for Filipino retail stores (*tindahan*).

**Stack:**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth)
- Jose (JWT session management)
- @zxing/library (Barcode scanning)
- next-pwa (Progressive Web App)

---

## Folder Structure

```
tindahanweb/
├── database/
│   └── schema.sql              ← Run this in Supabase SQL Editor
├── public/
│   ├── manifest.json           ← PWA manifest
│   └── icons/                  ← PWA app icons
├── scripts/
│   └── generate-admin-hash.js  ← Utility to generate password hash
├── src/
│   ├── app/
│   │   ├── (protected)/        ← All authenticated pages
│   │   │   ├── layout.tsx      ← Protected layout with nav
│   │   │   ├── page.tsx        ← POS (homepage)
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx    ← Inventory management
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx    ← Sales records list
│   │   │   │   └── [id]/page.tsx ← Transaction details
│   │   │   └── logs/
│   │   │       └── page.tsx    ← Activity logs
│   │   ├── actions/
│   │   │   ├── auth.ts         ← Login/logout Server Actions
│   │   │   ├── inventory.ts    ← Product CRUD Server Actions
│   │   │   └── sales.ts        ← Complete sale Server Action
│   │   ├── api/
│   │   │   ├── products/route.ts
│   │   │   ├── sales/route.ts
│   │   │   └── stats/route.ts
│   │   ├── login/page.tsx      ← Public login page
│   │   ├── layout.tsx          ← Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── Navigation.tsx      ← Sidebar + mobile bottom nav
│   │   └── BarcodeScanner.tsx  ← Camera barcode scanner
│   ├── lib/
│   │   ├── supabase.ts         ← Supabase client (public + admin)
│   │   ├── session.ts          ← JWT session management
│   │   └── types.ts            ← Shared TypeScript types
│   └── middleware.ts            ← Route protection
└── .env.local                  ← Your local env variables
```

---

## 1. Supabase Setup

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click **New Project**
3. Choose a name (e.g., `tindahan-pos`) and region (Singapore is closest to PH)
4. Set a strong database password (save it somewhere safe)
5. Wait for the project to provision (~2 minutes)

### Step 2: Run the Database Schema
1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `database/schema.sql` from this project
4. Paste the entire contents into the SQL Editor
5. Click **Run**

> ✅ This creates all tables, indexes, the admin user (password: `admin123`), and sample products.

### Step 3: Get Your API Keys
1. Go to **Settings → API** in your Supabase project
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Never expose the `service_role` key to the browser.**

### Step 4: Disable Row Level Security (RLS) — Optional for Single-Owner Store
By default Supabase enables RLS. Since this is a single-owner system with server-side auth, you can either:

**Option A:** Disable RLS on all tables (easier):
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
```

**Option B:** Add policies for the service role (more secure):
```sql
-- Allow service role full access to all tables
CREATE POLICY "Service role access" ON users FOR ALL USING (true);
CREATE POLICY "Service role access" ON products FOR ALL USING (true);
CREATE POLICY "Service role access" ON sales FOR ALL USING (true);
CREATE POLICY "Service role access" ON sale_items FOR ALL USING (true);
CREATE POLICY "Service role access" ON activity_logs FOR ALL USING (true);
```

---

## 2. Local Development

### Prerequisites
- Node.js 18 or newer
- npm 9 or newer

### Step 1: Clone & Install
```bash
cd tindahanweb
npm install
```

### Step 2: Set Up Environment Variables
Create a file `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SESSION_SECRET=any-long-random-string-at-least-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

To generate a SESSION_SECRET, run in PowerShell:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Step 3: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Login with:**
- Username: `admin`
- Password: `admin123`

---

## 3. Vercel Deployment

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/tindahan-pos.git
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)

### Step 3: Add Environment Variables
In Vercel project settings, add:
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `SESSION_SECRET` | A random 32+ character string |
| `NEXT_PUBLIC_APP_URL` | Your Vercel app URL (e.g. `https://tindahan.vercel.app`) |

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy automatically.

> 💡 After first deployment, set `NEXT_PUBLIC_APP_URL` to your actual Vercel URL, then re-deploy.

---

## 4. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous API key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only!) |
| `SESSION_SECRET` | ✅ | Secret key for signing JWT session cookies |
| `NEXT_PUBLIC_APP_URL` | Optional | Used for absolute URL generation |

---

## 5. Credentials

**Default Admin Login:**
- Username: `admin`
- Password: `admin123`

> ⚠️ Change this immediately after setup! To change the password:
> 1. Generate a new hash: `node scripts/generate-admin-hash.js newpassword`
> 2. Run in Supabase SQL Editor: `UPDATE users SET password_hash = 'new-hash' WHERE username = 'admin';`

---

## 6. Using the Barcode Scanner

The barcode scanner uses your device camera to read barcodes.

**Supported formats:**
- EAN-13 (common in Philippine stores)
- UPC-A (international products)
- Code 128 (modern retail)

**On Android Chrome:** Grant camera permission when prompted.
**On iPhone Safari:** Go to Settings → Safari → Camera → Allow.
**On Desktop:** Use a webcam; camera must face the barcode.

If scanning doesn't work, you can always type the barcode manually in the scanner overlay.

---

## 7. PWA Installation

To install as a mobile app:

**Android:**
1. Open the app URL in Chrome
2. Tap the browser menu (⋮)
3. Select "Add to Home screen"

**iPhone:**
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

---

## 8. Security Notes

- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Sessions use signed JWT cookies (httpOnly, sameSite: lax)
- ✅ Middleware protects all routes except `/login`
- ✅ Service role key is only used server-side
- ✅ All mutations require valid session
- ✅ SQL injection protected by Supabase parameterized queries
- ⚠️ Change the default admin password immediately
- ⚠️ Use a strong, random SESSION_SECRET in production
