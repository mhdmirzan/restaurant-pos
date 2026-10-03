# Food Corner POS

A minimal, production-ready restaurant Point of Sale system built for **Food Corner**.

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** v4
- **MongoDB Atlas** + Mongoose
- **Vercel** for deployment

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd restaurant-pos
npm install
```

### 2. Configure Environment

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=foodcorner_pos
```

### 3. Seed Initial Menu Items

```bash
npm run seed
```

This adds the starter menu items with price = 0. Update prices through the Menu Management page.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **POS Screen** — Select items → auto-price → set quantity → payment → save
- **Menu Management** — Add/edit/activate/deactivate menu items
- **Sales History** — Filter by today/yesterday/date range, view bill details
- **Dashboard** — Today's stats, recent sales, top selling items

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables: `MONGODB_URI`, `MONGODB_DB_NAME`
4. Ensure MongoDB Atlas Network Access allows `0.0.0.0/0` (or Vercel IPs)
5. Deploy

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # POS screen
│   ├── menu/page.tsx       # Menu management
│   ├── sales/page.tsx      # Sales history
│   ├── dashboard/page.tsx  # Dashboard
│   └── api/
│       ├── menu/           # Menu CRUD
│       ├── sales/          # Sale creation & listing
│       ├── dashboard/      # Dashboard aggregation
│       └── health/         # DB connection check
├── components/
│   ├── POS/                # POS components
│   └── UI/                 # Shared UI components
├── lib/
│   ├── mongodb.ts          # DB connection
│   ├── models/             # Mongoose models
│   └── utils.ts            # Formatting utilities
├── types/                  # TypeScript types
scripts/
└── seed.js                 # Database seeder
```
