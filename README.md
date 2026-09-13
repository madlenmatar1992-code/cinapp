# CineBook - Next.js & Neon PostgreSQL Cinema Booking Platform

![CineBook Cinema](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop)

CineBook is a full-stack, responsive cinema booking and digital ticketing platform built with **Next.js 15 (App Router, TypeScript)**, **Tailwind CSS**, **Neon Serverless PostgreSQL**, and **Drizzle ORM**. It features real-time seat reservation with atomic concurrency locks, payment processing with idempotency guards, and instant digital tickets with scannable QR codes.

---

## 🌟 Key Features

### 🎬 Cinema Experience (App Agent)
- **Cinematic Dark Theme**: Crafted with deep onyx tones, ambient gold accents, and curved cinema screen lighting.
- **Dynamic Search & Multi-Filters**: Filter movies instantaneously by title, storyline, genre, language, cinema location, and date tabs.
- **Interactive Curved Seat Map**:
  - Realistic auditorium layout with screen curvature visual.
  - Tiered seating: Standard, VIP ($4.00 premium), Luxury Recliner ($6.00 premium), and Wheelchair Accessible.
  - Live seat statuses: `AVAILABLE`, `HELD` (10-minute hold), `BOOKED`, `BLOCKED`.
  - Real-time pricing recalculation with convenience fees and 8% tax.
- **Checkout & Payment (Test Mode)**:
  - Instant one-click test card buttons (Success Card vs Declined Card).
  - Idempotency key injection on every transaction to eliminate double charges.
- **Digital Tickets with QR Codes**:
  - Perforated ticket styling with booking reference code (`CB-XXXX-YYYY`).
  - High-resolution scannable QR code generated from verified booking payload.
  - One-click print stylesheet and `.ics` calendar file download.
- **Booking History & Cancellations**:
  - View upcoming and past reservations.
  - Cancel eligible reservations before showtime with automatic seat re-pooling and simulated refunds.
- **Admin Management Portal**:
  - Real-time KPI dashboard: Gross box office revenues, tickets sold, active catalog, scheduled screenings.
  - Movie catalog manager (add new movies, genres, backdrops, posters, trailers).
  - Showtime scheduler with automatic seat matrix initialization.
  - Manual trigger for the expired seat hold cleanup routine.

---

## ⚙️ Architecture & Database Engine (Database Engine Agent)

### Database Schemas (Neon PostgreSQL via Drizzle ORM)
All tables follow strict database rules:
- **UUID Primary Keys** (`gen_random_uuid()`)
- **UTC Timestamps** (`timestamp({ withTimezone: true })`)
- **Integer Minor Units**: All monetary values are stored in cents (e.g. `$18.50 = 1850`), never floating-point.
- **Unique Constraints**:
  - Cinema screen names: `(cinema_id, name)`
  - Auditorium seat coordinates: `(auditorium_id, row_label, seat_number)`
  - Showtime seat single-reservation: `(showtime_id, seat_id)`
  - Booking reference codes & payment idempotency keys.

### 10-Step Transactional Booking Protocol
1. **Begin DB Transaction**: Initializes an ACID transaction boundary.
2. **Lock Showtime-Seat Records**: Atomic conditional reservation matching available seats.
3. **Confirm Seat Availability**: Verifies requested seats are `AVAILABLE` or have expired holds.
4. **Create Temporary Hold**: Sets status to `HELD` with a 10-minute expiration window (`hold_expires_at`).
5. **Server-Side Price Calculation**: Calculates base showtime price + seat tier premiums + convenience fees + 8% tax.
6. **Create Pending Booking**: Records booking with status `PENDING` and items.
7. **Commit Transaction**: Safe commitment of temporary hold.
8. **Confirm on Verified Payment**: Sets seats to `BOOKED` and booking to `CONFIRMED` only upon verified payment.
9. **Idempotency Verification**: Idempotency keys prevent duplicate bookings and duplicate charges.
10. **Rejection Safeguard**: Rejects with `409 Conflict` if any requested seat is no longer available.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cinapp
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: CineBook includes a persistent PostgreSQL PGlite driver fallback out-of-the-box, allowing you to run and test locally immediately even before configuring cloud Neon credentials!)*

### 3. Run Database Migrations
```bash
npm run db:migrate
```

### 4. Seed Sample Blockbusters, Cinemas & Showtimes
```bash
npm run db:seed
```
This populates:
- **6 Blockbuster Movies**: *Dune: Part Two*, *Oppenheimer*, *Interstellar*, *Spider-Man*, *Inception*, *Blade Runner 2049*
- **3 Cinemas**: New York (Times Square), Los Angeles (Century City), Chicago (River North)
- **6 Auditoriums**: IMAX Laser 70mm, Dolby Atmos, VIP Recliner Suites
- **480 Tiered Seats & 72 Scheduled Screenings**
- **Default Accounts**:
  - **Admin**: `admin@cinebook.com` / `AdminPass123!`
  - **Customer**: `user@cinebook.com` / `UserPass123!`

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated QA Verification Suite (QA Agent)

Run the full end-to-end QA test suite:
```bash
npm run test:qa
```

The automated test suite verifies 31 individual test cases across:
1. **Database integrity & seeded entities**
2. **User registration, bcrypt hashing, and JWT session cookies**
3. **Server-side pricing, seat tier adjustments, and minor currency units**
4. **Concurrent collision prevention**: Two asynchronous requests attempt to reserve the same seat simultaneously; verifies exactly one succeeds and the other receives a 409 rejection.
5. **Payment processing, confirmation, and QR digital ticket generation**
6. **Payment idempotency replay protection**
7. **Payment failure simulation**
8. **Expired seat hold automatic release routine**
9. **Booking cancellation and seat re-pooling**

---

## 🌐 Vercel Deployment Instructions

### Step 1: Provision Neon PostgreSQL on Vercel Marketplace
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Go to **Storage** -> **Create Database** -> Select **Neon Serverless PostgreSQL**.
3. Choose your preferred region and click **Continue**.
4. Vercel automatically exposes `DATABASE_URL` (pooled connection) to your project.

### Step 2: Configure Environment Variables in Vercel
Under your Project Settings -> **Environment Variables**, configure:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled Neon PostgreSQL connection string | `postgresql://...pooler...neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | 32+ character random string for signing cookies | `your-secure-jwt-secret-key-32-chars` |
| `CRON_SECRET` | Secret key guarding the hold release endpoint | `your-secure-cron-secret-key` |
| `NEXT_PUBLIC_APP_URL`| Production domain | `https://your-cinebook.vercel.app` |
| `PAYMENT_PROVIDER` | Payment provider mode | `STRIPE_TEST` |

### Step 3: Run Migrations on Deployment
Add a build step or run migrations using `npm run db:migrate` or configure Drizzle push in your deployment command:
```bash
npm run db:migrate && npm run db:seed && next build
```

### Step 4: Scheduled Seat Hold Release (Vercel Cron)
The project includes `vercel.json` with a 5-minute automated cron job:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
Vercel will automatically send authenticated requests with `Authorization: Bearer <CRON_SECRET>` to safely release expired holds.

---

## 📄 License
MIT License. Built for cinema enthusiasts.
