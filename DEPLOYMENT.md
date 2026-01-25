# Deployment Guide: Render + MongoDB Atlas

This guide explains how to deploy **IntelliDesk AI** to the cloud using Render (for hosting) and MongoDB Atlas (for the database).

## 1. Prerequisites
- A GitHub account (where this repository is pushed).
- A [Render](https://render.com) account.
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.

## 2. Set Up MongoDB Atlas (Database)
Since Render does not provide managed MongoDB, you need a free cloud instance.

1.  **Create Cluster**: Login to MongoDB Atlas and create a new **FREE (M0)** cluster.
2.  **Create User**: Go to "Database Access" -> "Add New Database User".
    - Username: `admin` (or your choice)
    - Password: **Save this password!**
3.  **Allow Access**: Go to "Network Access" -> "Add IP Address" -> **Allow Access from Anywhere (0.0.0.0/0)**.
    - *Note: This is required for Render to connect.*
4.  **Get Connection String**:
    - Click **Connect** -> **Drivers**.
    - Copy the connection string (e.g., `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?...`).
    - Replace `<password>` with your actual password.
    - **This is your `MONGO_URI`.**

## 3. Deploy to Render

1.  **Connect GitHub**: Login to Render and click "New" -> **Blueprint Instance**.
2.  **Select Repo**: Connect your GitHub account and select the `Agglomeration 2.0` repository.
3.  **Approve Blueprint**: Render will detect `render.yaml`. Click **Apply**.
4.  **Configure Environment Variables**:
    Render will ask for values for the variables defined in `render.yaml`. Enter them:
    
    | Variable | Value |
    | :--- | :--- |
    | `MONGO_URI` | Your MongoDB Atlas Connection String (from Step 2) |
    | `GROQ_API_KEY` | Your Groq API Key |
    | `EMAIL_USER` | Your Email Address |
    | `EMAIL_PASS` | Your Email App Password |
    | `IMAP_SERVER` | `imap.gmail.com` (or your provider) |

5.  **Deploy**: Click **Update/Deploy**.

## 4. Verify
- Render will deploy two services:
    1.  `intellidesk-backend` (Web Service)
    2.  `intellidesk-frontend` (Static Site)
- Once finished, click the **Frontend URL** provided by Render.
- Your app is now live! 🚀

## Troubleshooting
- **Build Failed?** Check the Logs tab in Render.
- **Backend Initializing...** The free tier spins down after inactivity. Give it 50 seconds to wake up on first load.
- **Database Error?** Check your `MONGO_URI` in Render Environment variables. Ensure `<password>` is correct and Network Access allows `0.0.0.0/0`.
