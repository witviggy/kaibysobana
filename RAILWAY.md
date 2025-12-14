# Railway Deployment Guide (Single Container)

This setup runs your Frontend and Backend in a **single Docker container** to save memory and cost.

## 1. Prerequisites
- GitHub Account (with this repo pushed).
- Railway Account (freemium/trial).

## 2. Setup on Railway

1.  **New Project**: Go to Railway Dashboard -> **New Project** -> **Deploy from GitHub repo**.
2.  Select your repository.
3.  **Variables**: Before it builds, go to **Variables** tab and add:
    *   `PORT`: `5000`
    *   `NODE_ENV`: `production`
    *   `GOOGLE_CLIENT_ID`: (Your Google ID)
    *   `GOOGLE_CLIENT_SECRET`: (Your Google Secret)
    *   `SESSION_SECRET`: (Random String)
    *   `DATABASE_URL`: (Add a Postgres plugin or paste external DB URL)

    > **Note**: If using Railway's Postgres plugin, `DATABASE_URL` is added automatically.

## 3. Database
-   In the Railway Project view, right-click (or click "New") -> **Database** -> **Add PostgreSQL**.
-   Run your `backend/db/init.sql` query in the database (Railway has a query tool via "Connect" -> "Data").

## 4. Google Auth Update
-   Once deployed, Railway gives you a URL (e.g., `https://web-production-1234.up.railway.app`).
-   Update your Google Console:
    *   **Authorized Origin**: `https://web-production-1234.up.railway.app`
    *   **Redirect URI**: `https://web-production-1234.up.railway.app/auth/google/callback`

## How it works
The `Dockerfile` in the root:
1.  Builds your React app.
2.  Copies it into the Node.js backend.
3.  Runs the Node.js backend, which serves both the API and the React files.
