# Deployment Guide for StitchFlow

This guide explains how to deploy the StitchFlow application in a production environment using Docker.

## Prerequisites

- **Docker** and **Docker Compose** installed on the target server (e.g., VPS, AWS EC2, DigitalOcean Droplet).
- **Google OAuth Credentials** (Client ID and Client Secret) configured in Google Cloud Console.
    - **Authorized JavaScript Origins**: `http://your-domain.com` (or IP address)
    - **Authorized Redirect URIs**: `http://your-domain.com/auth/google/callback`

## Recommended Hosting Providers

Since this application is fully containerized with Docker, a **Virtual Private Server (VPS)** is the most cost-effective and flexible option.

1.  **DigitalOcean (Droplets)**:
    -   **Type**: Basic Droplet (Regular Intel with SSD).
    -   **Size**: 1GB - 2GB RAM / 1 CPU (sufficient for starting).
    -   **OS**: Ubuntu 22.04 LTS (often has a "Docker on Ubuntu" marketplace image).
    -   **Cost**: ~$6-12/month.
    
2.  **AWS Lightsail**:
    -   **Type**: Linux / Unix instance.
    -   **Size**: 2GB RAM / 1 vCPU.
    -   **Cost**: ~$10/month.

3.  **Hetzner Cloud** (Great value for money in Europe):
    -   **Type**: CX22.
    -   **Cost**: ~$5/month.

## Free Hosting Options (The "Split Stack" Strategy)

Deploying a full Docker container with a database for free is difficult because few providers offer enough RAM for all three services (Frontend, Backend, DB) in one place.

To host for **$0/month**, you should split the services:

1.  **Frontend (React)**: Deploy to **Vercel** or **Netlify**.
    *   **Cost**: Free.
    *   **Method**: Push your `frontend` folder to GitHub and connect it to Vercel.

2.  **Database (PostgreSQL)**: Use a managed cloud database.
    *   **Supabase** or **Neon.tech**: Both offer generous free tiers for PostgreSQL.
    *   **Cost**: Free.
    *   **Method**: Create a project, get the connection string (`postgres://...`), and use it in your backend.

3.  **Backend (Node.js)**: Deploy to **Render** or **Railway**.
    *   **Cost**: Free (Render has a free tier that spins down after inactivity).
    *   **Method**: Connect your GitHub repo to Render, choosing "Web Service" for the `backend` folder.

> **Note**: This method requires configuring environment variables (`DB_HOST`, `DB_PASSWORD`, etc.) in each service's dashboard separately, rather than using `docker-compose.yml`.

## Configuration

1.  **Clone the Repository**:
    ```bash
    git clone <your-repo-url>
    cd kai-by-sobana
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory (or use system env vars) to override defaults:
    ```env
    # Database
    DB_USER=postgres
    DB_PASSWORD=secure_password
    DB_NAME=stitchflow

    # Auth (REQUIRED)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    SESSION_SECRET=long_secure_random_string
    ```

    > **Note**: Update `docker-compose.prod.yml` if you want to use a different `.env` file location or specific values.

## Running in Production

To start the application in production mode (using Nginx for frontend):

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

- **`-d`**: Detached mode (runs in background).
- **`--build`**: Rebuilds images to ensure latest code is used.

## Accessing the App

- **Frontend**: `http://your-server-ip` (Port 80)
- **Backend API**: `http://your-server-ip:5000`

## Updates

To update the application after pulling changes:

```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```
This will rebuild the containers with the new code and restart them with minimal downtime.

## Troubleshooting

- **Logs**: View logs with `docker-compose -f docker-compose.prod.yml logs -f`
- **Database**: Data is persisted in the `postgres_data_prod` volume.
