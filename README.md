# ⚡ SportSync

> **Modern AI & Community Sports Matchmaking Platform**  
> Engineered with Apple Design Principles, Interactive 3D WebGL (Three.js), Real-time WebSockets, and Multi-Device Responsive Architecture (iPhone Mini to 65" 4K TV).

---

## 🌟 Highlights

- **Apple-Inspired Design Language:** Frosted glassmorphism, double-bezel concentric hardware cards, tactile micro-interactions, dark/light adaptive mode.
- **Interactive 3D Sports Engine:** High-performance WebGL 3D sports canvas powered by Three.js with real-time inertia, physics rotation, and interactive ball switcher.
- **Fixed & Verified Auth:** Full email trimming/normalization, case-insensitivity, password validation, protected routes, and 1-click test credentials.
- **Multi-Viewport Architecture:** Fluid responsive layout from compact mobile viewports (360px) up to 4K ultra-wide and 65-inch screens.
- **100% Free Cloudflare Pages & Render Deployment:** Zero-dollar hosting guide with SPA client-side routing (`_redirects`), dynamic CORS for `*.pages.dev`, and Render Free Tier web service.

---

## 📂 Project Structure

```
SportSync/
├── client/                     # React 19 Frontend (Tailwind CSS, Three.js, Lucide)
│   ├── public/
│   │   └── _redirects          # Cloudflare Pages SPA client-side routing rule
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sports3DScene.jsx           # Interactive 3D Three.js canvas
│   │   │   ├── SafeGoogleMapsWrapper.jsx   # Error-resilient map wrapper
│   │   │   ├── Navbar.jsx                  # Apple-style adaptive navigation
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Login.jsx                   # Apple-style 3D Split-Screen Sign In
│   │   │   ├── Register.jsx                # New athlete registration
│   │   │   ├── SportSelection.jsx          # Sport preference onboarding
│   │   │   ├── Dashboard.jsx               # Main match arena & 3D hero island
│   │   │   └── ...
│   │   └── services/api.js     # Dynamic API endpoint router & interceptors
│   └── package.json
├── server/                     # Node.js + Express + Socket.io Backend
│   ├── config/db.js            # Resilient MongoDB connector
│   ├── controllers/
│   │   └── authController.js   # Cleaned register, login & getMe
│   ├── models/                 # Mongoose schemas (User, Match, Tournament, etc.)
│   ├── routes/                 # REST API endpoints
│   ├── socket/socketHandler.js # Real-time chat & notifications
│   ├── server.js               # Express server with dynamic CORS & Render proxy
│   └── package.json
└── .gitignore                  # Monorepo dependency & secrets exclusions
```

---

## 🆓 100% Free Hosting Guide ($0 / month)

You do **NOT** need any paid plan or paid blueprint. Everything can be hosted for **$0 forever** using the free tiers below:

### 1. Database: MongoDB Atlas (Free M0 Cluster)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create Deployment** > select **M0 (Free)** > choose any cloud region (e.g. AWS Mumbai / Frankfurt / us-east-1).
3. Under **Security Quickstart**:
   - Create a database user (e.g., username: `sportsync_admin`, password: `your_password`).
   - In **IP Access List**, click **Add IP Address** > choose **Allow Access from Anywhere (`0.0.0.0/0`)** so Render can connect.
4. Click **Connect** > **Drivers (Node.js)** > copy your connection string:
   `mongodb+srv://sportsync_admin:<password>@cluster0.mongodb.net/sportsync?retryWrites=true&w=majority`

---

### 2. Backend: Render (Free Web Service — $0/month)

> **Important:** Do NOT click "Blueprint". Use the standard free "Web Service":

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click the blue **New +** button > select **Web Service**.
3. Select **Build and deploy from a Git repository** > click **Next**.
4. Connect your repo: `https://github.com/mahanshstarktech/SportSync.git`.
5. Fill in the setup form:
   - **Name:** `sportsync-backend`
   - **Region:** Any close region (e.g. Singapore or Frankfurt)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Select **Free** ($0/month)
6. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = Your MongoDB Atlas connection string from Step 1
   - `JWT_SECRET` = Any random string (e.g. `super_secret_sportsync_token_2026`)
   - `CLIENT_URL` = Your Cloudflare Pages URL (e.g. `https://sportsync.pages.dev` or leave blank for now)
7. Click **Deploy Web Service**.
8. Render will deploy your API and give you a free URL like:
   `https://sportsync-backend-xxxx.onrender.com`

---

### 3. Frontend: Cloudflare Pages (100% Free Forever — Unlimited Bandwidth)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > click **Workers & Pages** in the left sidebar.
2. Click **Create application** > select the **Pages** tab > click **Connect to Git**.
3. Select your repository: `mahanshstarktech/SportSync`.
4. Configure the build settings:
   - **Project Name:** `sportsync`
   - **Production branch:** `main`
   - **Framework preset:** `Create React App` (or `None`)
   - **Root directory:** `client`
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
5. Expand **Environment variables (advanced)** > click **Add variable**:
   - `NODE_VERSION` = `20`
   - `REACT_APP_API_URL` = Your Render backend URL from Step 2 (e.g. `https://sportsync-backend-xxxx.onrender.com`)
   - `REACT_APP_GOOGLE_MAPS_API_KEY` = (Optional) Leave empty or paste your Google Maps key
6. Click **Save and Deploy**.
7. Cloudflare Pages will build and deploy your site to a free global URL like `https://sportsync.pages.dev`!

*(If you ever update `CLIENT_URL` on Render with your final Cloudflare URL, Render will whitelist it for real-time WebSockets and API requests automatically).*

---

## 💻 Local Development Setup

### Server:
```bash
cd server
npm install
npm run dev
# Running on http://localhost:5001 (avoids macOS ControlCenter AirPlay conflict on 5000)
```

### Client:
```bash
cd client
npm install
npm start
# Opens http://localhost:3000
```
