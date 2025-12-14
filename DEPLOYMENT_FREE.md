# Free Tier Deployment Guide (Split Stack)

This guide helps you deploy StitchFlow for free using **Vercel** (Frontend), **Render** (Backend), and **Supabase** (Database).

## 1. Database (Supabase)

1.  Go to [Supabase.com](https://supabase.com/) and create a free account.
2.  Create a **New Project**.
    *   **Region**: Choose one close to you (e.g., Singapore/Mumbai).
    *   **Database Password**: **Save this!** You'll need it later.
3.  Once created, go to **Settings (Gear Icon) -> Database**.
4.  Copy the **Connection String (Nodejs)**. It looks like:
    `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`
    *   *Tip: Replace `[YOUR-PASSWORD]` with the password you created.*

### Run Initial SQL
Since we aren't using Docker to init the DB, you need to run the SQL query manually.
1.  In Supabase, go to **SQL Editor**.
2.  Copy the content from your local file `backend/db/init.sql`.
3.  Paste it into the editor and click **Run**.
    *   *This creates all your tables (clients, orders, etc.).*

---

## 2. Backend (Render)

1.  Push your code to **GitHub**.
2.  Go to [Render.com](https://render.com/) and create a free account.
3.  Click **New + -> Web Service**.
4.  Connect your GitHub repository.
5.  **Configuration**:
    *   **Name**: `stitchflow-backend` (or similar)
    *   **Root Directory**: `backend` (Important!)
    *   **Environment**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Instance Type**: Free
6.  **Environment Variables** (Add these):
    *   `DATABASE_URL`: (Paste the Supabase connection string from Step 1)
    *   `GOOGLE_CLIENT_ID`: (Your Google Client ID)
    *   `GOOGLE_CLIENT_SECRET`: (Your Google Client Secret)
    *   `SESSION_SECRET`: (Random string)
    *   `NODE_ENV`: `production`
7.  Click **Create Web Service**.
8.  **Wait**: It will deploy and give you a URL (e.g., `https://stitchflow-backend.onrender.com`). **Copy this URL.**

---

## 3. Frontend (Vercel)

1.  Go to [Vercel.com](https://vercel.com/) and create a free account.
2.  Click **Add New... -> Project**.
3.  Import the same GitHub repository.
4.  **Configuration**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   `VITE_API_URL`: `https://stitchflow-backend.onrender.com/api`
        *   *Note: Use the Render URL you copied, and append `/api` at the end.*
6.  Click **Deploy**.

## 4. Final Google Auth Update

Now that you have real URLs, you need to update Google Cloud Console.

1.  Go to Google Cloud Console -> APIs & Services -> Credentials.
2.  Edit your OAuth Client.
3.  **Authorized JavaScript Origins**:
    *   Add your Vercel URL (e.g., `https://stitchflow-frontend.vercel.app`)
4.  **Authorized Redirect URIs**:
    *   Add your Render Backend URL + callback (e.g., `https://stitchflow-backend.onrender.com/auth/google/callback`)

---

## Testing

1.  Open your Vercel URL.
2.  Try to Log In.
3.  It should redirect to Google -> Render -> Vercel (Logged In).
