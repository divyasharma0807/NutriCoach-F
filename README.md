# NutriCoach - Fitness & Nutrition Management Platform

NutriCoach is a premium, production-ready web application designed for personal fitness coaches and their clients. The platform streamlines diet tracking, client progress visualization, meeting schedules, and includes a automated transaction dashboard alongside 30-calendar-day subscription enforcement with Razorpay.

---

## 🚀 Key Modules & Features

### 1. Super Admin Dashboard (Confidential Payments Portal)
* **Real-time Analytics**: Tracks Total Revenue, Monthly Revenue, Successful/Failed Payments, and Active/Expired coaches.
* **Transaction Ledger**: Fully paginated transactions list (15 records/page) with filtering by date range, status, payment method, and client/coach search queries.
* **Details Overlay**: View complete Razorpay signature hashes, payment dates, and linked subscription meta.

### 2. Coach Workspace & Client Progression
* **Active client logs**: Detailed progress trackers, uploaded images, and historical metrics.
* **Dynamic Diet Plans**: High-performance UI to construct, schedule, and assign multi-meal nutritional schedules.
* **Meeting Schedules**: Complete scheduling calendar with built-in push notification alerts.

### 3. Client Portal
* **Meal Check-ins**: Log daily food/water intake against assigned coach templates.
* **Result Uploads**: Log weights, body measurements, and attach progression pictures.

### 4. Razorpay Subscription & Expiry Enforcement
* **Enforced Access**: Route guards automatically check subscription status at login/refresh and lock the dashboard for coaches without active subscriptions.
* **Calendar-Day Duration**: Subscriptions run for exactly 30 calendar days, terminating at exactly `12:00 AM UTC` on the expiry date.
* **Auto-renewal / Append**: Renewals append 30 days onto remaining active durations, ensuring no credit is lost.

### 5. Smart UX Expiry Reminders
* **Lifecycle popups**: Displays custom alerts at exactly 10-days and 3-days remaining (cached via local storage so they appear only once per subscription lifecycle).
* **Warning banner**: High-contrast, premium alert bar rendered dynamically when exactly 1 day remains.

---

## 🛠 Tech Stack

* **Backend**: Node.js, Express, MongoDB (Mongoose ODM), Firebase Admin SDK (Push Notifications), Razorpay SDK.
* **Frontend**: React (v18), TypeScript, Vite, Vanilla CSS.
* **Styling**: Structured Design Tokens (Color Palette, Typography, Glassmorphism, Micro-Animations).

---

## 📂 Project Structure

```bash
├── backend/
│   ├── config/             # Database connection & Razorpay setup
│   ├── controllers/        # Express handlers (Payments, Admin, Clients, Coaches)
│   ├── middleware/         # Auth, Roles verification, & masked Error Handlers
│   ├── models/             # Mongoose Schemas (Subscription, Transaction, Coach, etc.)
│   ├── routes/             # Express API Endpoints
│   ├── scripts/seed/       # Database clear and seeding manifest preset helper scripts
│   ├── utils/              # Firebase FCM and image helpers
│   ├── app.js              # Core Express App
│   └── server.js           # Server Entry Point
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Topbar, Sidebar, UI Modals
│   │   ├── data/           # API wrapper clients
│   │   ├── pages/          # Admin, Coach, Client workspaces & LoginPage
│   │   ├── utils/          # Razorpay load and navigation handlers
│   │   ├── App.tsx         # Root routes config
│   │   └── main.tsx        # React client entry point
```

---

## 💻 Installation & Setup

### Prerequisites
* **Node.js** (v18.x or above)
* **MongoDB** (Local instance or Atlas connection string)
* **Razorpay** Developer credentials
* **Firebase Cloud Messaging (FCM)** key setup

---

### Step 1: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file using the template below:
   ```env
   PORT=5000
   NODE_ENV=production
   
   # MongoDB Setup
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nutricoach
   
   # Token Auth
   JWT_SECRET=your_jwt_signing_secret_key
   
   # Razorpay Integration (Backend Only Secrets)
   RAZORPAY_KEY_ID=rzp_test_yourKeyID
   RAZORPAY_KEY_SECRET=yourRazorpaySecretKey
   RAZORPAY_WEBHOOK_SECRET=yourRazorpayWebhookSecret
   
   # Firebase configuration details (For server push)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-sdk-service-email@gmail.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

4. Database seeding (optional - populates initial test entries):
   ```bash
   npm run seed
   ```
   *(To wipe and re-seed, run `npm run reset`)*

5. Run development server:
   ```bash
   npm run dev
   ```

---

### Step 2: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   
   # Firebase Client Config (For foreground messages)
   VITE_FIREBASE_API_KEY=your_client_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_VAPID_KEY=your_web_push_vapid_key
   ```

4. Launch dev workspace:
   ```bash
   npm run dev
   ```
   *(Runs on `http://localhost:5173`)*

---

### Step 3: Production Build

To build the static distribution asset package for the frontend client:
```bash
npm run build
```
This generates optimized static files inside the `dist/` directory, ready to serve via Nginx, Vercel, or Express static middleware.

---

## 🔒 Security Hardening Standards

* **Credential Isolation**: All API secrets (Webhook keys, Private hashes, Razorpay secrets) are isolated to the backend shell. Only the public `RAZORPAY_KEY_ID` is ever sent to the browser interface.
* **Payload Trimming**: API endpoints omit database internal pointers, system paths, and raw credentials.
* **Global Error Interceptor**: Masks raw database casting, ValidationExceptions, and 11000 duplicate keys into client-safe status codes and messages.
* **CORS & CORS Headers**: Restricted connection mappings for trusted client endpoints.
