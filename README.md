# 🎬 CineCart

A movie booking web app — browse movies, pick seats, order snacks, and pay — all in one place.

## Tech Stack

- **React + Vite + TypeScript**
- **Tailwind CSS** + shadcn/ui
- **Supabase** (Auth, Postgres, Realtime)
- **Razorpay** (test payments)
- **Framer Motion** (animations)

## Features

- 🎥 Browse movies & available shows
- 💺 Interactive seat selection (A1–H8 grid)
- 🍿 Snack ordering
- 💳 Razorpay test payment
- 📱 QR ticket on booking confirmation
- 👤 My Orders page (active + history)
- 🛡️ Admin dashboard — manage movies, shows, snacks, orders

## Getting Started

```sh
npm install
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

## Admin Access

Insert a row into the `user_roles` table in Supabase with `role = 'admin'` for your user ID, then visit `/admin`.
