# Deployment

This project can run on your own computer or online. For the local setup steps, see the README. This file covers the hosted site.

## Where things are hosted

The frontend and backend are hosted separately.

| Part | Host | Address | Notes |
|---|---|---|---|
| Frontend | Netlify | https://steady-florentine-af6fe2.netlify.app | Static React build |
| Backend | Render | https://equiphub.onrender.com | Express API. The free plan sleeps after 15 minutes idle, so the first request can take about a minute |
| Database | MongoDB Atlas | n/a | Network Access must allow Render (`0.0.0.0/0` on the free plan) |

## Local vs hosted

The same settings take different values in each place.

| Setting | Local | Hosted |
|---|---|---|
| Frontend address | http://localhost:5173 | https://steady-florentine-af6fe2.netlify.app |
| Backend address | http://localhost:5050 | https://equiphub.onrender.com |
| `FRONTEND_URL` (backend) | `http://localhost:5173`, in `backend/.env` | The Netlify address, in Render's Environment tab |
| `VITE_API_URL` (frontend) | Not set (defaults to `http://localhost:5050/api`) | `https://equiphub.onrender.com/api`, set when building |
| Where backend variables live | `backend/.env` (never committed) | Render, Environment tab |
| Database | MongoDB Atlas (Network Access must allow your IP) | MongoDB Atlas (Network Access must allow Render) |

## Backend on Render

### Settings

1. Click New, then Web Service, and pick the repository and branch.
2. Set these:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: Free

### Environment variables

Add these in the service's Environment tab. Do not set `PORT`, because Render sets it.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `FRONTEND_URL` | Netlify address with no trailing slash. Used in password reset and Stripe return links |
| `RESEND_API_KEY` | Sends password reset emails. A placeholder value lets the server start, but emails only send with a real key |
| `RESEND_FROM_EMAIL` | Optional sender address |
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`), needed for checkout. Never use a live key |
| `CLOUDINARY_URL` | Needed for seller photo uploads |

Only the Stripe secret key is used. The publishable key is not needed. Without a Stripe key the site still works for browsing, login and listings, but checkout fails.

To try a payment, use Stripe's test card `4242 4242 4242 4242` with any future expiry, any 3-digit CVC and any postcode.

### Check it works

After the deploy finishes, open `https://equiphub.onrender.com/api/health`. It should show:

```json
{"status":"ok","message":"EquipHub API is running"}
```

## Frontend on Netlify

The frontend needs `VITE_API_URL` set to the backend address, including `/api`. Vite reads it when the site is built, so after changing it you must build and deploy again.

`frontend/public/_redirects` makes page refreshes work on routes like `/browse`.

### Method used for the live site: upload a build

This works even when the GitHub repository belongs to another account.

1. Build the site:

   ```bash
   cd frontend
   VITE_API_URL=https://equiphub.onrender.com/api npm run build
   ```

2. In Netlify, open the project's Deploys page and drag the `frontend/dist` folder onto it. For the very first deploy, use "Upload your project files" on the Projects page.
3. Make sure the project is set to Public under Project configuration, General, Visitor access. New Netlify projects are private by default, and a private site only opens for the owner.

To update the live site after changing the code, repeat steps 1 and 2.

This is a manual, static deploy. It is not linked to GitHub, so pushes do not update it. Team access and Git-based deploys from the team's repository need a paid Netlify plan, which is why the free plan is used this way.

### Alternative: deploy from GitHub

If Netlify has access to the repository, import it with these settings and add `VITE_API_URL` as an environment variable. The site then redeploys on every push.

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`

The backend on Render redeploys automatically on new commits if Auto-Deploy is on for the service, or manually from the Render dashboard.

## Checking a deployment

1. `https://equiphub.onrender.com/api/health` shows the "running" message.
2. The Netlify site loads and the browse page shows items.
3. Register, log in and log out.
4. Buy an item with the Stripe test card.
5. Check it at phone width too.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Failed to fetch" on the site | `VITE_API_URL` is wrong or missing, or the Render service is still waking up. Wait a minute and refresh |
| Netlify says the site is private | Set Project visibility to Public in Netlify |
| Backend crashes on startup | A required variable is missing (for example `RESEND_API_KEY`) |
| Backend runs but nothing loads | `MONGO_URI` is wrong, or Atlas Network Access blocks Render |
| 404 when refreshing a page | The `_redirects` file is missing from `frontend/public` |
| Checkout says "You did not provide an API key" | `STRIPE_SECRET_KEY` is not set on Render |
| Seller photo upload fails | `CLOUDINARY_URL` is not set on Render |
| Reset or payment links go to the wrong place | `FRONTEND_URL` is missing or wrong on Render |