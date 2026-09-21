# Progress Log

Built for **Community Resource Network SA** Group: IRP-C262C_4101

## Step 1 — Backend setup
- Initialised Express server (`server.js`)
- Connected to MongoDB Atlas
- Environment config via `.env` (Mongo URI, JWT secret, Stripe key placeholder)
- Health check route: `GET /api/health`

## Step 2 — Equipment model & API
- Built `Equipment` Mongoose schema
  - Flexible `specs` field (Map type) to support varying attributes across equipment categories (e.g. marquee size vs audio wattage)
  - Includes hire rate, deposit amount, quantity, booking conditions, cancellation policy
  - `isActive` flag used for soft-delete instead of removing records
- Built CRUD routes (`/api/equipment`)
  - `GET /` — list active equipment
  - `GET /:id` — single item
  - `POST /` — create
  - `PUT /:id` — update
  - `DELETE /:id` — soft delete (sets `isActive: false`)
- Tested via curl: confirmed create + retrieve working end-to-end

## Step 3 — Frontend setup
- Scaffolded React app with Vite
- Cleaned out boilerplate
- Built `EquipmentCard` component
- `App.jsx` fetches equipment from backend API and renders a responsive grid
- Basic styling added (dark header, card grid, category badges)
- Confirmed full stack working: MongoDB, Express, and React connected as such live data rendering in browser

## Next steps
- Booking model & API (availability, hire requests, admin approval)
- Authentication (admin vs public users)
- Stripe payment/deposit integration
- Availability calendar UI
- Admin dashboard & reporting