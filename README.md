# EquipHub

Community equipment hire, sale, and donation platform for **Community Resource Network SA**
(university group project, unit **IRP-C262C_4101**, group **C262T-4101**).

This is a from-scratch rebuild: nothing here carries over from any earlier attempt.
Every feature below was actually run and verified against a real database before being
marked done — see "Verification notes" for exactly what that means in this environment.

## Status

| Build-plan step (see brief §6) | Status |
|---|---|
| 1. Authentication & 3-role model | ✅ Built & verified |
| 2. Admin account creation process | ✅ Built & verified (`npm run seed:admin`, not a public endpoint) |
| 3. Equipment/inventory management, price cap | ⬜ Not started |
| 4. Booking system | ⬜ Not started |
| 5. Admin dashboard | ⬜ Stub page only (proves routing/auth, no real data yet) |
| 6. Seller dashboard | ⬜ Stub page only (proves routing/auth, no real data yet) |
| 7. PayPal integration | ⬜ Not started |
| 8. Reporting | ⬜ Not started |

## Tech stack

- **Backend:** Node.js (ESM) + Express + Mongoose, JWT auth with bcrypt-hashed passwords
- **Frontend:** React 19 + Vite, plain CSS (dark header, rounded white cards, soft shadows)
- **Database:** MongoDB (Mongoose driver) — see note below on Atlas vs local
- **Payments:** PayPal — not yet integrated (build-plan step 7)

## Project layout

```
backend/
  src/
    app.js               Express app (routes, middleware) — no side effects on import
    server.js             Entry point: connects DB, starts the HTTP server
    config/db.js          Mongoose connect/disconnect helpers
    models/User.js        User schema — 3 roles (admin/seller/renter), bcrypt hashing
    controllers/          Route handlers
    routes/                auth routes + role-gated dashboard stub routes
    middleware/            JWT auth (`protect`) + role gate (`authorize`)
    scripts/createAdmin.js Controlled, non-public way to create the first admin
  tests/auth.test.js       Integration tests (register/login/role-access), run with Jest
frontend/
  src/
    pages/                 Login, Register, Home, and 3 dashboard stubs
    context/AuthContext.jsx  Holds the JWT + user, persisted to localStorage
    components/             Header, Card, ProtectedRoute (role-based route guard)
    api/authApi.js          Thin fetch wrapper around the backend auth API
```

## Running it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit MONGODB_URI / JWT_SECRET as needed
npm run dev                # http://localhost:5000
```

`GET /api/health` should return `{"status":"ok", ...}` once it's up.

### 2. Create the first admin account

Admins can't self-register through the public API (by design — see brief §2 & §6.2).
Set `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` / `ADMIN_SEED_NAME` in `backend/.env`, then:

```bash
cd backend
npm run seed:admin
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

### 4. Run the automated tests

```bash
cd backend
npm test
```

## Database: MongoDB Atlas vs local

`backend/.env.example` defaults `MONGODB_URI` to a local MongoDB
(`mongodb://127.0.0.1:27017/equiphub`). For real development or the final deployed app,
replace it with your **MongoDB Atlas** connection string — nothing in the code is
Atlas-specific, Mongoose talks to either one identically. Get a free-tier Atlas cluster at
https://www.mongodb.com/cloud/atlas/register (no credit card needed), then paste its
`mongodb+srv://...` URI into `.env`.

### Verification notes (read this before trusting the "✅ verified" claims above)

The dev sandbox this project was scaffolded in has **no Docker, no root/sudo, and no
network access to MongoDB's own binary-download servers** (`fastdl.mongodb.org`,
`*.mongodb.net` are blocked by network policy in that sandbox — this has nothing to do
with your own machine or network). That ruled out both a normal local MongoDB install and
`mongodb-memory-server` (which needs to download a real `mongod` binary).

To still verify against a **real MongoDB-wire-protocol server** rather than a mock, the
auth feature was tested against [FerretDB](https://www.ferretdb.com/) running locally with
its SQLite backend — a genuine MongoDB-protocol-compatible database engine, just not
MongoDB's own binary. All 11 Jest tests in `backend/tests/auth.test.js` passed against it,
plus a full manual run: both servers started for real, and a register → login →
role-gated-dashboard round trip was exercised over actual HTTP with CORS enabled, exactly
as the frontend would call it.

`backend/tests/auth.test.js` defaults to `mongodb-memory-server` (a real `mongod`), which
will work unmodified on a normal internet connection without the sandbox's restrictions —
that's the standard way to run it going forward. It also honours a `TEST_MONGODB_URI` env
var if you'd rather point it at a specific running Mongo instance:

```bash
TEST_MONGODB_URI="mongodb://127.0.0.1:27017/equiphub_test" npm test
```

**What this means for you:** the auth logic itself is proven against a real database
engine, not guessed at. What's *not* yet proven from inside that sandbox is behaviour
against MongoDB's own server specifically — and it turns out that gap can't be closed from
there at all: the sandbox has no direct DNS resolution and no raw outbound TCP (only
HTTP/HTTPS through an allowlisted forward proxy), so a MongoDB driver connection — which
needs a live SRV/TXT DNS lookup and a raw TCP socket on port 27017 — cannot reach Atlas or
any other live Mongo server from there, confirmed with a direct connection attempt
(`querySrv ECONNREFUSED`). `backend/.env` already has the real Atlas URI wired in and is
correct; it just needs to be run somewhere with normal internet access — your own machine's
regular terminal, for example — to actually exercise it:

```bash
cd backend
npm test                # uses TEST_MONGODB_URI if set, otherwise mongodb-memory-server
npm run seed:admin      # creates the real admin account in Atlas
npm run dev              # confirm `MongoDB connected.` in the log, then hit /api/health
```

That will create the real admin account in your Atlas cluster and give the final, genuine
confirmation this closes the loop — it's the last unverified piece.

## API reference (current)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | none | Liveness check |
| POST | `/api/auth/register` | none | `{ name, email, password, role }` — role must be `seller` or `renter`; `admin` is rejected (403) |
| POST | `/api/auth/login` | none | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Bearer token | Returns the authenticated user |
| GET | `/api/dashboard/admin` | Bearer token, role `admin` | Stub, proves role gating |
| GET | `/api/dashboard/seller` | Bearer token, role `seller` | Stub, proves role gating |
| GET | `/api/dashboard/renter` | Bearer token, role `renter` | Stub, proves role gating |

## Out of scope (agreed with client/mentor — brief §2)

Native mobile apps, automated seller payouts/commission split, multiple admin permission
tiers, automated ID/fraud verification, shipping/logistics integration, automated equipment
condition tracking, in-platform messaging, formal dispute-resolution workflow, external
CRM/accounting integration, multi-currency/international payments.

## Next steps (per brief §6, in order)

1. Equipment/inventory management — seller listings (photo, price, description), admin
   price-cap enforcement, admin approval workflow.
2. Booking system — rent/buy requests, real-time availability, server-side double-booking
   prevention.
3. Real admin dashboard (replacing the current stub): approve/reject listings, manage
   inventory & pricing, full visibility into bookings and donations.
4. Real seller dashboard (replacing the current stub): create/manage listings, view status.
5. PayPal integration for purchases/rentals and donations.
6. Reporting: admin visibility into bookings, purchases, and donations in one place.
