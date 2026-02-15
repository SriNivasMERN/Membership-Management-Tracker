## Membership Management Tracker (MERN)

This is a full-stack **Membership Management Tracker** built with the MERN stack:

- **MongoDB + Mongoose**
- **Express + Node.js**
- **React (Vite)**
- **Material UI (MUI)**
- **Notistack**
- **Day.js**
- **Recharts**
- **Framer Motion**
- **react-hook-form + zod + @hookform/resolvers**
- **Axios**

The app manages:

- Business settings
- Plans
- Slots
- Pricing rules
- Members (with plan/slot snapshots)
- Dashboard summaries and charts

### Project structure

- `client/` – Vite React SPA (MUI, Notistack, RHF, Recharts, Framer Motion)
- `server/` – Express API (MongoDB, Mongoose, Zod)

### Getting started

1. Install all dependencies:

   ```bash
   npm run install:all
   ```

2. Configure environment:

   - Copy `server/.env.example` to `server/.env` and adjust values if needed.

3. Run development servers (client + server concurrently):

   ```bash
   npm run dev
   ```

4. Open the client in your browser (by default):

   - `http://localhost:5173`

### Notes

- All API routes are under `/api/*`.
- CORS is configured on the server to allow the configured `CLIENT_ORIGIN`.
- See `PRD.md` for a detailed product requirements description used to implement this app.

# Membership-Management-Tracker
# MembershipManagementTracker
# MembershipManagementTracker
# Membership-Management-Tracker
# Membership-Management-Tracker
