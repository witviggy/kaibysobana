# Free Tier Deployment Guide (Split Stack)

Deploy StitchFlow for **$0/month** using Vercel, Render, and Supabase.

## Architecture

| Service | Provider | Free Tier |
|---------|----------|-----------|
| Frontend | Vercel | Unlimited |
| Backend | Render | 750 hrs/month |
| Database | Supabase | 500MB PostgreSQL |
| **Images** | Supabase Storage | 1GB |

> [!WARNING]
> **Render Free Tier**: Server spins down after 15min idle. First request after sleep takes ~30-60 seconds.

---

## 1. Database & Storage (Supabase)

1.  Go to [Supabase.com](https://supabase.com/) → Create free account → **New Project**
    - **Region**: Choose closest (e.g., Singapore/Mumbai)
    - **Database Password**: **Save this!**

2.  **Get Database Connection String**:
    - Settings (⚙️) → Database → Connection String (Nodejs)
    - Looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

3.  **Run Initial SQL**:
    - SQL Editor → Paste contents of `backend/db/init.sql` → **Run**

4.  **Create Storage Bucket**:
    - Go to **Storage** (left sidebar)
    - Click **New Bucket** → Name: `images`
    - ✅ Check **Public bucket** → Create

5.  **Get Storage Keys**:
    - Settings (⚙️) → **API**
    - Copy: **Project URL** (e.g., `https://xxx.supabase.co`)
    - Copy: **service_role key** (NOT anon key!)

---

## 2. Backend (Render)

1.  Push code to **GitHub**
2.  Go to [Render.com](https://render.com/) → New + → **Web Service**
3.  Connect your GitHub repository

4.  **Configuration**:
    - **Name**: `stitchflow-backend`
    - **Root Directory**: `backend`
    - **Environment**: Node
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
    - **Instance Type**: Free

5.  **Environment Variables** (Add all):

    | Variable | Value |
    |----------|-------|
    | `DATABASE_URL` | Supabase connection string from Step 1 |
    | `SUPABASE_URL` | Supabase Project URL (e.g., `https://xxx.supabase.co`) |
    | `SUPABASE_SERVICE_KEY` | Supabase service_role key |
    | `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
    | `GOOGLE_CLIENT_SECRET` | Your Google OAuth Secret |
    | `SESSION_SECRET` | Random string (e.g., `my-super-secret-key-12345`) |
    | `NODE_ENV` | `production` |
    | `BACKEND_URL` | `https://your-app.onrender.com` (fill after deploy) |
    | `FRONTEND_URL` | `https://your-app.vercel.app` (fill after Vercel deploy) |

6.  Click **Create Web Service** → Wait for deploy → Copy your Render URL

> [!NOTE]
> You'll need to update `BACKEND_URL` and `FRONTEND_URL` after both deploys are complete.

---

## 3. Frontend (Vercel)

1.  Go to [Vercel.com](https://vercel.com/) → Add New → **Project**
2.  Import your GitHub repository

3.  **Configuration**:
    - **Framework Preset**: Vite
    - **Root Directory**: `frontend`

4.  **Environment Variables**:

    | Variable | Value |
    |----------|-------|
    | `VITE_API_URL` | `https://your-app.onrender.com` (Render URL from Step 2) |

5.  Click **Deploy** → Copy your Vercel URL

---

## 4. Final Setup

### Update Render Environment Variables
Go back to Render Dashboard → Your Service → Environment:
- Set `BACKEND_URL` = your Render URL (e.g., `https://stitchflow-backend.onrender.com`)
- Set `FRONTEND_URL` = your Vercel URL (e.g., `https://stitchflow.vercel.app`)
- Click **Save Changes** → Render will auto-redeploy

### Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Edit your OAuth Client:
   - **Authorized JavaScript Origins**: Add your Vercel URL
   - **Authorized Redirect URIs**: Add `https://your-render-url.onrender.com/auth/google/callback`

---

## 5. Test

1. Open your Vercel URL
2. Click **Login with Google**
3. You should be redirected: Google → Render → Vercel (logged in!)
4. Try uploading a fabric image → Should work (stored in Supabase)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Login redirects fail | Check `BACKEND_URL` and `FRONTEND_URL` match your actual URLs |
| Image upload fails | Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set. Check bucket is named `images` and is public |
| Database errors | Run `backend/db/init.sql` in Supabase SQL Editor |
| CORS errors | Ensure `FRONTEND_URL` matches your Vercel URL exactly |
