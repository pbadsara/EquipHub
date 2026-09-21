# EquipHub

A web application for small community organisations to publish, manage, and hire out shared equipment like marquees, tables, audio gear, sporting equipment, and cooking facilities and also with replacing ad hoc email/spreadsheet booking arrangements.

Built for **Community Resource Network SA** Group: IRP-C262C_4101

## Features (planned/in progress)

- Equipment listings with images, categories, and flexible specs
- Availability calendars and booking period management
- Hire request and admin approval workflow
- Payment and refundable deposit collection via Stripe
- Booking conditions and cancellation rules
- Admin reporting
- Responsive design — works on desktop, tablet, and mobile

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Atlas)
- **Payments:** Stripe (test mode)

## Project Structure
├── backend/ # Express API server
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API route handlers
│ └── server.js # Entry point
├── frontend/ # React application
│ └── src/
│ ├── components/
│ └── App.jsx
└── README.md


## Getting Started

### Prerequisites
- Node.js installed
- A free MongoDB Atlas account (or local MongoDB)

### Backend setup
```bash
cd backend
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```
Runs on `http://localhost:5050`

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

## Status

Actively in development. See `PROGRESS.md` for a build log.