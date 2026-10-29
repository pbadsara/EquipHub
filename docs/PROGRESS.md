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

## Step 4 — Merge with main
- Merged the team's refactored `main` into `dev/amudhan` and resolved the conflicts
- Updated local `.env` for the new backend (`MONGO_URI` and `RESEND_API_KEY` are now required)
- Checked that backend and frontend run together locally

## Step 5 — EQH logo
- Added an SVG logo (plug in a ring with "EQH") as the favicon and beside the name in the header and footer

## Step 6 — Deployment
- Frontend API address now comes from `VITE_API_URL`
- Added `_redirects` so page refreshes work on Netlify
- Backend deployed on Render and confirmed live at `/api/health`
- Frontend built with `VITE_API_URL` and deployed on Netlify by uploading the `dist` folder
- Set `FRONTEND_URL` on Render so the backend knows the Netlify address
- Added the Stripe test key on Render and confirmed checkout works on the live site

## Step 7 — Testing and documentation
- Tested the live site on a phone
- Rewrote `README.md` so someone can run the project locally or use the live site: setup steps, environment variables, how to create an admin account, API overview and troubleshooting
- Added `DEPLOYMENT.md` (hosting, local vs hosted settings, updating the live site) and `backend/.env.example`

## Status
The project is live at https://steady-florentine-af6fe2.netlify.app. Not built: booking conditions and cancellation rules, and admin reporting.