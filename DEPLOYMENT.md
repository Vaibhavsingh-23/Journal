# Render.com Deployment Guide

Deploy your Journal application to Render.com **completely FREE** - no credit card required!

---

## Why Render?

- ✅ **Truly Free** - No trial, no credit card needed
- ✅ **750 hours/month** - More than enough for personal projects
- ✅ **Auto-deploy** from GitHub
- ✅ **Easy setup** - Similar to Railway
- ✅ **Free SSL** - Automatic HTTPS

---

## Step 1: Prepare Your Code

### Push to GitHub (if not already done)

```bash
cd d:\Journal
git init
git add .
git commit -m "Ready for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Journal.git
git push -u origin main
```

---

## Step 2: Sign Up for Render

1. Go to **[render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Render to access your repositories

**No credit card required!** ✅

---

## Step 3: Deploy Backend

### 3.1 Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub account if not already connected
4. Find and select your **"Journal"** repository

### 3.2 Configure Build Settings

Fill in these details:

| Setting | Value |
|---------|-------|
| **Name** | `journal-backend` (or any name you prefer) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Java` |
| **Build Command** | `mvn clean install -DskipTests` |
| **Start Command** | `java -jar target/*.jar` |

### 3.3 Select Free Plan

- Scroll down to **"Instance Type"**
- Select **"Free"** plan
- **0 GB RAM, Shared CPU** - Perfect for demos!

### 3.4 Add Environment Variables

Click **"Advanced"** and add these environment variables:

```
SPRING_DATA_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/journal_db
GEMINI_API_KEY=your_gemini_api_key_here
SERVER_PORT=10000
```

**Important Notes:**
- Replace with your actual MongoDB Atlas connection string
- Replace with your actual Gemini API key
- **PORT must be 10000** (Render's default)

### 3.5 Deploy!

1. Click **"Create Web Service"**
2. Render will start building (takes 3-5 minutes)
3. Watch the logs in real-time
4. Once deployed, you'll get a URL like: `https://journal-backend.onrender.com`

---

## Step 4: Deploy Frontend

### Option A: Deploy on Render (Recommended)

1. Click **"New +"** > **"Static Site"**
2. Select your **Journal** repository
3. Configure:
   - **Name:** `journal-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** Leave empty
   - **Publish Directory:** `.` (current directory)

4. Click **"Create Static Site"**

### Option B: Deploy on Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `frontend` folder
3. Done! Get instant URL

### Option C: Deploy on Vercel (Alternative)

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory to `frontend`
4. Deploy

---

## Step 5: Update Frontend Configuration

### 5.1 Update API URL

Edit `frontend/js/api.js`:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:8080';

// To your Render backend URL:
const API_BASE_URL = 'https://journal-backend.onrender.com';
```

### 5.2 Redeploy Frontend

- If using Render: Push changes to GitHub (auto-deploys)
- If using Netlify/Vercel: Redeploy or push to GitHub

---

## Step 6: Update CORS Configuration

Edit `backend/src/main/java/com/example/config/WebConfig.java`:

```java
.allowedOrigins(
    "https://journal-frontend.onrender.com",  // Your Render frontend
    "https://your-app.netlify.app",           // If using Netlify
    "https://your-app.vercel.app",            // If using Vercel
    "http://localhost:5500"                   // For local development
)
```

Push changes to GitHub - Render will auto-deploy!

---

## Step 7: Configure MongoDB Atlas

**Important:** Allow Render to connect to your database.

1. Go to **MongoDB Atlas** dashboard
2. Click **"Network Access"** (left sidebar)
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"**
5. Enter `0.0.0.0/0`
6. Click **"Confirm"**

This allows Render's servers to connect to your database.

---

## Step 8: Test Your Deployment

1. Visit your frontend URL
2. Register a new user
3. Login
4. Create a journal entry
5. Verify AI analysis works
6. Test all features

---

## Important: Free Tier Behavior

### Auto-Sleep Feature
- Free tier apps **sleep after 15 minutes** of inactivity
- First request after sleep takes **~30 seconds** to wake up
- Subsequent requests are instant
- Perfect for demos and portfolio projects!

### How to Handle Sleep
- Expect first load to be slow
- Add a loading message on frontend
- Consider using a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 14 minutes (keeps it awake)

---

## Troubleshooting

### Backend Won't Start

**Check Logs:**
1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Look for errors

**Common Issues:**
- ❌ Wrong MongoDB connection string → Check environment variables
- ❌ Port mismatch → Ensure `SERVER_PORT=10000`
- ❌ Build failed → Check Maven dependencies

### Frontend Can't Connect

**Check:**
- ✅ API_BASE_URL is correct in `frontend/js/api.js`
- ✅ CORS is configured in `WebConfig.java`
- ✅ Backend is running (check Render dashboard)

### Database Connection Failed

**Check:**
- ✅ MongoDB Atlas allows `0.0.0.0/0` (all IPs)
- ✅ Connection string is correct
- ✅ Database user has read/write permissions

### AI Analysis Not Working

**Check:**
- ✅ Gemini API key is correct
- ✅ API key has quota remaining
- ✅ Check backend logs for API errors

---

## Monitoring & Maintenance

### View Logs
- Render Dashboard > Your Service > **Logs**
- Real-time log streaming
- Filter by severity

### Monitor Usage
- Render Dashboard > **Usage**
- Track hours used (750/month free)
- Monitor bandwidth

### Automatic Deployments
- Push to `main` branch → Auto-deploys
- No manual intervention needed
- View deployment history in dashboard

---

## Upgrade Options (Optional)

If you need more:
- **Starter Plan:** $7/month
  - No sleep
  - 512 MB RAM
  - Always on

But free tier is perfect for:
- ✅ Portfolio projects
- ✅ Demos
- ✅ Learning projects
- ✅ Personal use

---

## Cost Summary

| Service | Cost | Limits |
|---------|------|--------|
| **Render Backend** | FREE | 750 hrs/month, sleeps after 15 min |
| **Render Frontend** | FREE | 100 GB bandwidth/month |
| **MongoDB Atlas** | FREE | 512 MB storage |
| **Gemini API** | FREE | Rate limits apply |
| **Total** | **$0/month** | Perfect for demos! |

---

## Next Steps

1. ✅ Deploy backend on Render
2. ✅ Deploy frontend (Render/Netlify/Vercel)
3. ✅ Update API URL in frontend
4. ✅ Update CORS configuration
5. ✅ Test all features
6. ✅ Share your live app!

---

## Support Resources

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Render Community:** [community.render.com](https://community.render.com)
- **Status Page:** [status.render.com](https://status.render.com)

---

**You're all set!** 🚀 Your Journal app will be live in minutes, completely free!
