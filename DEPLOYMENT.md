# Split Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide walks you through deploying your **Medicine Reminder** project using the **Split Method**:
- **Backend API**: Hosted on **Render** (Free Web Service)
- **Frontend App**: Hosted on **Vercel** (Free SPA Hosting)

---

## 🚀 Step 1: Deploy Backend to Render

1. **Push your code to GitHub**:
   Make sure your latest code with `server/` and `client/` is pushed to your GitHub repository.

2. **Log into Render**:
   - Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.

3. **Create a New Web Service**:
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository (`medicine-reminder`).

4. **Configure Service Details**:
   - **Name**: `medicine-reminder-backend` (or your preferred name)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will build and deploy your Express backend.
   - Once deployed, copy your Render Web Service URL (e.g., `https://medicine-reminder-backend.onrender.com`).
   - Test it by opening `https://medicine-reminder-backend.onrender.com/` in your browser. You should see `{"status":"online", ...}`.

---

## 🌐 Step 2: Deploy Frontend to Vercel

1. **Log into Vercel**:
   - Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.

2. **Import Your Repository**:
   - Click **Add New...** -> **Project**.
   - Select your `medicine-reminder` repository and click **Import**.

3. **Configure Project Settings**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click *Edit* and select `client`.
   - **Build and Output Settings**: Default (`npm run build`, output: `build`).

4. **Add Environment Variable**:
   - Expand the **Environment Variables** section.
   - Add:
     - **Key**: `REACT_APP_API_URL`
     - **Value**: `https://your-medicine-reminder-backend.onrender.com` *(Paste your Render URL from Step 1, without a trailing slash)*

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will build your React application and provide a live URL (e.g., `https://medicine-reminder.vercel.app`).

---

## ⚙️ How Split Hosting Works in this Project

1. **Dynamic Environment Variable (`REACT_APP_API_URL`)**:
   - Handled in [`client/src/config/api.js`](file:///c:/Users/sivas/Downloads/medicine-reminder/client/src/config/api.js).
   - In production on Vercel: All API requests automatically point to `https://your-backend.onrender.com/api/...`.
   - In local development: Requests fallback to `http://localhost:5000` or the local development proxy.

2. **CORS Support on Express Backend**:
   - Configured in [`server/server.js`](file:///c:/Users/sivas/Downloads/medicine-reminder/server/server.js) to allow cross-origin requests from your Vercel frontend domains with credentials.

3. **SPA Direct Route Handling**:
   - Handled by [`client/vercel.json`](file:///c:/Users/sivas/Downloads/medicine-reminder/client/vercel.json) to ensure page refreshes route smoothly back to React.

4. **Persistent Initial Data & Cold Start Protection**:
   - The backend automatically initializes sample patients, caregivers, and reminder histories in `server/data/` if starting on a clean filesystem.
