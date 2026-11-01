# ⚡ SportSync

> **Modern AI & Community Sports Matchmaking Platform**  
> Engineered with Apple Design Principles, Interactive 3D WebGL (Three.js), Real-time WebSockets, and Multi-Device Responsive Architecture (iPhone Mini to 65" 4K TV).

---

## 🌟 Highlights

- **Apple-Inspired Design Language:** Frosted glassmorphism, double-bezel concentric hardware cards, tactile micro-interactions, dark/light adaptive mode.
- **Interactive 3D Sports Engine:** High-performance WebGL 3D sports canvas powered by Three.js with real-time inertia, physics rotation, and interactive ball switcher.
- **Fixed & Verified Auth:** Full email trimming/normalization, case-insensitivity, password validation, protected routes, and 1-click test credentials.
- **Multi-Viewport Architecture:** Fluid responsive layout from compact mobile viewports (360px) up to 4K ultra-wide and 65-inch screens.
- **Cloudflare Pages & Render Ready:** Pre-configured SPA redirects (`_redirects`), dynamic CORS for `*.pages.dev`, health checks, and Render blueprint (`render.yaml`).

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
├── render.yaml                 # 1-Click Render Web Service Blueprint
└── .gitignore                  # Monorepo dependency & secrets exclusions
```

---

## 🚀 Deployment Instructions

### 1. Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint** (or **Web Service**).
3. Connect your GitHub repository: `https://github.com/mahanshstarktech/SportSync.git`.
4. Render will automatically read `render.yaml`:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
5. Configure Environment Variables in the Render dashboard:
   - `MONGO_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/sportsync?retryWrites=true&w=majority`)
   - `JWT_SECRET`: Any secure random secret (or let Render auto-generate it).
   - `CLIENT_URL`: Your Cloudflare Pages URL (e.g., `https://sportsync.pages.dev`).
6. Deploy! Render will give you a backend URL like `https://sportsync-backend.onrender.com`.

---

### 2. Frontend on Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select repository: `https://github.com/mahanshstarktech/SportSync.git`.
3. Configure build settings:
   - **Framework Preset:** `Create React App` (or `None`)
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `build`
4. In **Environment Variables**:
   - `NODE_VERSION`: `20`
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://sportsync-backend.onrender.com`)
   - `REACT_APP_GOOGLE_MAPS_API_KEY`: *(Optional)* Your Google Maps API key.
5. Click **Save and Deploy**. Cloudflare Pages will build and deploy your app globally!

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
