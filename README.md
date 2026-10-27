<p align="center">
  <img src="frontend/public/favicon.svg" alt="EquipHub logo" width="120">
</p>

# EquipHub

A web application for small community organisations to publish, manage, and hire out shared equipment like marquees, tables, audio gear, sporting equipment, and cooking facilities, replacing ad hoc email and spreadsheet booking arrangements. Community members can also list their own items for sale or hire.

Built for **Community Resource Network SA**. Group: IRP-C262C_4101

**Live site:** https://steady-florentine-af6fe2.netlify.app
**API:** https://equiphub.onrender.com

The API runs on a free plan that sleeps when idle, so the first request after a quiet period can take about a minute. If the page says "Failed to fetch", wait a minute and refresh.

## What it does

- **Three roles on one login:** renter/buyer, seller and admin. Each role sees its own pages.
- **Seller listings:** sellers list an item for sale or for hire, with photos, a price and a category.
- **Admin review, field by field:** an admin approves or rejects each part of a listing (name, price, description, category, images, type) with a comment. A listing goes live only when every field is approved, and the seller sees exactly what to fix.
- **Browse and search:** public catalogue with search, category filter, price range and sorting.
- **Rental calendar:** renters pick exact dates, and days that are already booked are blocked out so double bookings can't happen.
- **Checkout:** payment through Stripe (test mode).
- **Order history** for renters, sellers and admins.
- **Reviews and star ratings** from buyers.
- **Password reset** by email.
- **Responsive design** for desktop, tablet and phone.

### Who can do what

| Role | Can do |
|---|---|
| Visitor (not logged in) | Browse and search the catalogue, view item details and booked dates |
| Renter / buyer | Everything a visitor can, plus buy or rent items, view their orders, leave reviews |
| Seller | Create and edit listings, upload photos, see their sales and rentals |
| Admin | Review listings field by field, manage categories, see all activity |

## Try it online

1. Open the live site and click **Sign up**.
2. Choose **Browse & rent/buy equipment** to shop, or **List my own equipment** to sell.
3. To pay for an item, use Stripe's test card: `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC and any postcode. No real money is taken.
4. Admin accounts can't be created from the sign-up form. See "Creating an admin account" below.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, bcrypt |
| Payments | Stripe Checkout (test mode) |
| Image hosting | Cloudinary |
| Email | Resend |
| Hosting | Netlify (frontend), Render (backend) |

## Run it locally

### What you need
- Node.js 22 or newer (the project was developed on Node 22)
- Git
- A free MongoDB Atlas cluster (steps below)

### 1. Get the code

```bash
git clone https://github.com/pbadsara/EquipHub.git
cd EquipHub
```

### 2. Set up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Under **Database Access**, add a database user with a password.
3. Under **Network Access**, allow your IP address (or `0.0.0.0/0` for a quick setup).
4. Click **Connect**, choose **Drivers**, and copy the connection string. Add the database name `equiphub` before the `?`, like this:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/equiphub?appName=Cluster0`

### 3. Start the backend

```bash
cd backend
npm install
cp .env.example .env   # then open .env and fill in your values
npm run dev
```

The terminal should print `Server running on http://localhost:5050` and then `Connected to MongoDB`. Check it at http://localhost:5050/api/health.

### 4. Start the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend talks to `http://localhost:5050/api` by default.

### Environment variables (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | Atlas connection string |
| `JWT_SECRET` | Yes | Secret used to sign login tokens. Use a long random string |
| `FRONTEND_URL` | Yes | `http://localhost:5173` locally. Used in password reset and Stripe return links |
| `RESEND_API_KEY` | Yes | Needed so the server can start. A placeholder such as `re_placeholder` works, but password reset emails only send with a real key |
| `RESEND_FROM_EMAIL` | No | Sender address for reset emails |
| `STRIPE_SECRET_KEY` | For checkout | Stripe test secret key (`sk_test_...`). Never use a live key |
| `CLOUDINARY_URL` | For uploads | Needed for sellers to upload photos |
| `PORT` | No | Defaults to 5050 |

Never commit your real `.env` file. It is already listed in `.gitignore`.

The frontend has one optional variable, `VITE_API_URL`, which points it at a different backend (for example the live one). Leave it unset for local development.

### Creating an admin account

Admins can't sign themselves up. To make one:

1. Sign up normally on the site.
2. In MongoDB Atlas, open **Browse Collections**, then the `equiphub` database and the `users` collection.
3. Edit your user and change `role` to `admin`.
4. Log out and back in.

## Project structure

```
├── backend/              # Express API server
│   ├── lib/              # Stripe, Cloudinary, email and order helpers
│   ├── middleware/       # JWT auth and role checks
│   ├── models/           # Mongoose schemas (User, Listing, Order, Review, Category)
│   ├── routes/           # API route handlers
│   └── server.js         # Entry point
├── frontend/             # React application
│   ├── public/           # Favicon, _redirects for Netlify
│   └── src/
│       ├── components/   # Cards, calendar, modals, header and footer pieces
│       ├── context/      # Auth and toast providers
│       ├── pages/        # One file per screen
│       ├── api.js        # All backend calls
│       └── App.jsx       # Routes, header and footer
├── DEPLOYMENT.md         # How the live site is hosted
├── PROGRESS.md           # Build log
└── README.md
```

## How it works

- **Security is enforced on the server.** The frontend decides what to show, but the backend checks the login token and the user's role on every protected route, so the rules still hold if someone bypasses the interface.
- **Listing review:** each field of a listing has its own status (pending, approved, rejected). The listing's overall status is recalculated every time it's saved, and it only appears in the public catalogue when all fields are approved.
- **Booking and payment:** the backend creates a Stripe Checkout session, the browser goes to Stripe's payment page, and when the user returns the backend confirms the payment with Stripe before creating the order. Item name and price are saved on the order, so old orders stay correct if a listing changes later.
- **Rental dates:** each rental order stores a start and end date, and those days are blocked for later bookings.

### API overview

Every endpoint starts with `/api`. "Logged in" means any valid account.

| Endpoint | Who can use it |
|---|---|
| `POST /api/auth/register` | Anyone |
| `POST /api/auth/login` | Anyone |
| `POST /api/auth/forgot-password` | Anyone |
| `POST /api/auth/reset-password` | Anyone |
| `GET /api/auth/me` | Logged in |
| `GET /api/listings` (approved listings only) | Anyone |
| `POST /api/listings` | Seller |
| `PUT /api/listings/:id` | Seller |
| `GET /api/listings/mine` | Seller |
| `GET /api/listings/review-queue` | Admin |
| `PUT /api/listings/:id/review` | Admin |
| `GET /api/categories` | Anyone |
| `POST /api/categories` | Admin |
| `PUT /api/categories/:id` | Admin |
| `DELETE /api/categories/:id` | Admin |
| `GET /api/orders/booked-dates/:itemType/:itemId` | Anyone |
| `GET /api/orders/mine-as-buyer` | Renter |
| `GET /api/orders/mine-as-seller` | Seller |
| `GET /api/orders/all` | Admin |
| `POST /api/payments/create-checkout-session` | Renter |
| `POST /api/payments/confirm` | Renter |
| `POST /api/reviews` | Renter |
| `GET /api/reviews/mine` | Renter |
| `POST /api/uploads/image` | Seller |
| `GET /api/equipment` and `GET /api/equipment/:id` (original organisation-owned items) | Anyone |

## Deployment

The live site runs on Netlify (frontend) and Render (backend). See `DEPLOYMENT.md` for the settings, environment variables, how to update it, and troubleshooting.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `npm run dev` says `package.json` not found | You're in the project root. Run it inside `backend` or `frontend` |
| Backend crashes on start with "Missing API key" | `RESEND_API_KEY` isn't in `backend/.env` |
| Backend starts but the log says it can't reach MongoDB | `MONGO_URI` is wrong or missing, or Atlas Network Access blocks your IP |
| Site shows "Failed to fetch" | The backend isn't running, or (online) the free server is waking up. Wait a minute |
| Checkout fails | `STRIPE_SECRET_KEY` isn't set, or isn't a test key |
| Seller can't upload photos | `CLOUDINARY_URL` isn't set |

## Limitations

- Payments run in Stripe test mode only.
- The free hosting plans sleep when idle, so the first online request can be slow.
- The live frontend is a static build uploaded manually to Netlify, not linked to GitHub for automatic deploys. Collaborative hosting (team access and deploying from the team's repository) needs a paid Netlify plan, so updating the live site means rebuilding and re-uploading `frontend/dist` (see `DEPLOYMENT.md`).
- Not included: booking conditions and cancellation rules, and admin reporting.

## References

Frontend
- React. https://react.dev
- React Router. https://reactrouter.com
- Vite. https://vite.dev
- Vite, environment variables and modes. https://vite.dev/guide/env-and-mode
- MDN Web Docs, Fetch API. https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- MDN Web Docs, SVG. https://developer.mozilla.org/en-US/docs/Web/SVG

Backend and database
- Node.js documentation. https://nodejs.org/docs/latest/api/
- Express. https://expressjs.com
- Express, routing guide. https://expressjs.com/en/guide/routing.html
- MongoDB Atlas documentation. https://www.mongodb.com/docs/atlas/
- MongoDB Atlas, IP access list. https://www.mongodb.com/docs/atlas/security/ip-access-list/
- Mongoose. https://mongoosejs.com
- JSON Web Tokens, introduction. https://jwt.io/introduction
- MDN Web Docs, Cross-Origin Resource Sharing (CORS). https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

Services
- Stripe documentation. https://docs.stripe.com
- Stripe Checkout. https://docs.stripe.com/payments/checkout
- Stripe, testing. https://docs.stripe.com/testing
- Cloudinary documentation. https://cloudinary.com/documentation
- Resend documentation. https://resend.com/docs

Hosting and tools
- Netlify documentation. https://docs.netlify.com
- Render documentation, free web services. https://render.com/docs/free
- Render, environment variables. https://render.com/docs/configure-environment-variables
- Netlify free plan limits in 2026. https://netli.fyi/blog/netlify-free-plan-limits-2026
- Git documentation. https://git-scm.com/doc
- GitHub Docs. https://docs.github.com

AI tools
- OpenAI. ChatGPT (GPT-4). Used as a research assistant and to help design the project logo. All final decisions and the application's design and code are the team's own work. https://chat.openai.com
- Anthropic. Claude AI (Claude Sonnet 5.5). Used for debugging and error checking during development, and to tidy the formatting of the Markdown files (alignment, centring and layout). All output was reviewed, run and tested by the developers before being committed. https://claude.ai

## Team and Ownership

Group IRP-C262C_4101

- Prateek (Team Lead)
- Shivani
- Raman
- Amudhan
- Naveen

EquipHub, including its code, design, EQH logo and documentation, is the original work of the team. It is a mock project for Community Resource Network SA, built for our subject, Industry Research Project. All effort and work on this project belongs to the team members.

Third-party libraries and services listed under References remain the property of their respective owners and are used under their own licences.