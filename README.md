# Ranju Art Gallery — Premium Portfolio, Store & Admin Dashboard

A full-stack e-commerce and gallery platform for Ranju Art Gallery: featuring an editorial art-gallery customer storefront, checkout with server-side price locking, customer reviews with admin moderation, studio video showcase, custom commission requests, and an admin management dashboard.

---

## Architecture & Tech Stack

- **Frontend:** React 18, Vite, React Router 6, Tailwind CSS (Hosted on **Render Static Site**)
- **Backend:** Node.js, Express.js (Hosted on **Render Web Service**)
- **Database:** **Supabase PostgreSQL** (`pg` connection pool with SSL)
- **Authentication:** Admin JWT authentication + bcrypt password hashing
- **File Uploads:** Multer with validated image storage (`/uploads`)

---

## Repository Structure

```
ranju-art-gallery/
├── client/              # React + Vite frontend
├── server/              # Node.js + Express API backend
│   └── src/
│       ├── config/      # db.js (PostgreSQL pool), upload.js
│       ├── controllers/ # Business logic
│       ├── models/      # PostgreSQL data models with parameterized queries
│       ├── routes/      # Express REST API routes
│       └── scripts/     # setupDb.js (automated schema & seed script)
├── database/
│   └── schema.sql       # PostgreSQL / Supabase DDL schema with triggers & indices
├── render.yaml          # Render Blueprint (Infrastructure-as-Code)
├── .env.example         # Root environment variables template
└── package.json         # Root scripts (dev:server, dev:client, build:client, db:setup)
```

---

## 1. Supabase PostgreSQL Setup

1. Log in to [Supabase](https://supabase.com/) and create a new project (e.g. `ranju-art-gallery`).
2. Go to **Project Settings** → **Database** → **Connection string**.
3. Copy your URI. You can choose either:
   - **Transaction Pooler (Port 6543 - Recommended for serverless/Render):**
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - **Direct Connection (Port 5432):**
     `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
4. Run the database schema in Supabase:
   - Go to the **SQL Editor** in the Supabase Dashboard.
   - Paste the contents of [`database/schema.sql`](file:///Users/karankumar/Desktop/Artist%20website%20/database/schema.sql) and click **Run**.
   - *Alternatively*, run the automated Node setup script from your computer or Render build step:
     ```bash
     DATABASE_URL="your-supabase-connection-string" npm run db:setup
     ```
   This creates all 11 tables, performance indices, updated_at triggers, and initial categories.

---

## 2. Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL or access to Supabase database

### Quick Start
```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment
cp .env.example server/.env
# Update DATABASE_URL in server/.env with your Supabase or PostgreSQL URL

# 3. Setup database & seeds
npm run db:setup

# 4. Start backend (http://localhost:5050)
npm run dev:server

# 5. Start frontend in a second terminal (http://localhost:5173)
npm run dev:client
```

---

## 3. Render Production Deployment Guide (Single Web Service)

Deploy the **entire application (React Frontend + Express Backend)** as **ONE single Render Web Service**:

1. In the [Render Dashboard](https://dashboard.render.com/), click **New** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/abhisin87654/ranju-ar-gallery.git`.
3. Configure the Web Service:
   - **Name:** `ranju-art-gallery` (or custom name like `ranjuart`)
   - **Region:** Choose the region closest to your Supabase database (e.g. Frankfurt or Singapore)
   - **Root Directory:** *(leave blank / project root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install --prefix server && npm install --prefix client && npm run build --prefix client
     ```
   - **Start Command:**
     ```bash
     npm start --prefix server
     ```
   - **Instance Type:** `Free`

4. Add **Environment Variables**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production environment |
   | `PORT` | `5050` | Default port (Render overrides with `PORT` dynamically) |
   | `DATABASE_URL` | `postgresql://postgres...` | Your Supabase PostgreSQL connection string |
   | `JWT_SECRET` | *(Render auto-generated or random 64-char string)* | e.g. from `openssl rand -hex 64` |
   | `CLIENT_URL` | `https://ranjuart.onrender.com` | Your Render Web Service URL |
   | `UPLOAD_DIR` | `uploads` | Local directory for art uploads |
   | `MAX_UPLOAD_MB` | `12` | Upload size limit in MB |
   | `DEFAULT_ARTIST_NAME`| `Ranju Kumar` | Artist display name |
   | `DEFAULT_CONTACT_EMAIL`| `karansin8672@gmail.com` | Artist inquiry email |
   | `DEFAULT_CONTACT_PHONE`| `+91 8294618672` | Artist phone number |
   | `DEFAULT_WHATSAPP_NUMBER`| `918294618672` | WhatsApp direct contact number |
   | `DEFAULT_INSTAGRAM_URL`| `https://instagram.com/with_sk.2` | Artist Instagram page |
   | `DEFAULT_YOUTUBE_URL`| `https://www.youtube.com/` | Artist YouTube channel |

   *(Notice: `VITE_API_URL` and `VITE_SERVER_URL` are **NOT** required because the frontend and backend share the exact same origin!)*

5. Click **Create Web Service**.
   - The build process will compile both frontend and backend dependencies, create the production bundle in `client/dist`, and launch the Express backend.
   - The single service will serve:
     - React SPA at `https://<your-service>.onrender.com/`
     - Express API at `https://<your-service>.onrender.com/api/...`
     - Uploaded images at `https://<your-service>.onrender.com/uploads/...`

---

## 4. Admin Access & Management

- **Admin Login:** `/admin/login`
- **Default Credentials:**
  - **Email:** `admin@gallery.com`
  - **Password:** `your_password`
*(You can update your credentials and artist profile from the Admin Settings tab anytime).*

### Everyday Admin Capabilities:
- **Artworks:** Add paintings with primary cover and up to 8 high-resolution gallery images, set prices, mark `AVAILABLE`, `RESERVED`, or `SOLD`, toggle `Featured`.
- **Orders:** View real-time orders with full shipping address and live status updates (`ORDER_PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`).
- **Reviews:** Approve, reject, or delete submitted collector reviews before they appear publicly.
- **Custom Painting Requests:** Review client commission briefs, budgets, and uploaded reference images.
- **Videos:** Add YouTube URLs with auto-generated video embeds and thumbnails.
- **Settings:** Update artist bio, profile photo, signature logo, phone number, email, WhatsApp, and hero copy without editing code.

---

## 5. Security & Concurrency Design

- **Server-Side Price Verification:** Client-submitted prices are ignored. Prices are queried directly from PostgreSQL during checkout.
- **Concurrency & Race Condition Prevention:** Orders are placed inside a PostgreSQL transaction using `SELECT ... FOR UPDATE` with an optimistic `version = version + 1` lock to guarantee that two customers cannot purchase the same 1-of-1 original painting simultaneously.
- **Password Security:** Salted bcrypt hashing with 12 rounds.
- **Protected Endpoints:** Admin REST endpoints require valid signed Bearer JWTs.
- **SQL Injection Protection:** All queries use parameterized inputs (`$1, $2...`).
- **Rate Limiting:** Protects admin authentication and public write endpoints (orders, reviews, messages).
