# Allo Health Inventory Reservation System

Live Demo: [https://allohealthinventory.vercel.app/](https://allohealthinventory.vercel.app/)

## Overview
This is an inventory reservation system built for high-concurrency environments. The system allows users to reserve items for a 10-minute window during checkout. It utilizes strict row-level locking via PostgreSQL (`SELECT FOR UPDATE`) within Prisma transactions to prevent overselling and race conditions when multiple users attempt to reserve the same stock level simultaneously.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma v7 (with `PrismaPg` driver adapter)
- **Validation**: Zod
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron

## Key Features
- **Concurrency Control**: Prevents overselling using atomic transactions and row-level locks.
- **Reservations**: Holds stock securely for 10 minutes.
- **Idempotency**: Protects reservation endpoints from duplicate charge/reservation requests.
- **Automated Expiry**: Vercel Cron triggers the `/api/cron/expire-reservations` endpoint every minute to release expired reservations back to available stock. Lazy cleanup is also performed on the `GET /api/products` route.
- **Concurrency Stress Test**: Includes a `scripts/stress-test.ts` utility that fires 100 simultaneous requests at a single item to mathematically prove the `SELECT FOR UPDATE` lock successfully prevents overselling.
- **Live Stock Updates**: Utilizes Supabase Realtime to broadcast PostgreSQL `UPDATE` events to the frontend, instantly updating available stock quantities on all connected clients without requiring a page refresh.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL (e.g., Supabase)

### Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
CRON_SECRET="your-secure-cron-secret"
```

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Seed the database with initial products and warehouses:
   ```bash
   npx prisma db seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture
The system logic is organized cleanly:
- `lib/reservations.ts`: Core business logic for creating, confirming, and releasing reservations, encapsulating the database transactions and locks.
- `lib/cleanup.ts`: Handles the logic for returning expired reservations back into available stock.
- `lib/prisma.ts`: Prisma Client singleton leveraging `pg` pool to prevent connection exhaustion.