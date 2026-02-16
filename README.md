# Membership Management Tracker (MERN)

Secure MERN app with:
- Cookie-based authentication (`httpOnly` access + refresh cookies)
- One-time owner setup flow (`/setup`) using `SETUP_TOKEN`
- Backend-enforced RBAC (`ADMIN`, `STAFF`, `VIEWER`)
- Admin-managed users with one-time password reset codes
- Audit logs for auth/admin actions

## Security-first env setup

1. Copy `server/.env.example` to `server/.env`.
2. Fill placeholders only with your own environment values.
3. Never commit `server/.env`.

Required `server/.env` keys:
- `MONGO_URI`
- `PORT`
- `NODE_ENV`
- `CLIENT_ORIGIN`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SETUP_TOKEN`
- `DEFAULT_ADMIN_EMAIL`
- `COOKIE_SAME_SITE` (`lax` for same-site; `none` + HTTPS for cross-site)

## Local development

1. Install dependencies:
```bash
npm run install:all
```

2. Configure `server/.env` from `server/.env.example`.

3. Start both apps:
```bash
npm run dev
```

4. Open client:
- `http://localhost:5173`

## One-time admin setup flow

1. Open `http://localhost:5173/setup`.
2. Enter:
- `SETUP_TOKEN`
- `DEFAULT_ADMIN_EMAIL`
- new admin password
3. Submit setup.
4. Setup is persisted in DB and then disabled.
5. Any later attempt to use setup is blocked and UI should use `/login`.

## RBAC rules

- `ADMIN`: dashboard, members, configuration, users, audit logs
- `STAFF`: dashboard + member CRUD
- `VIEWER`: dashboard + member read-only

Backend route guards are the primary enforcement.
Frontend route/nav hiding is secondary UX only.

## User management (ADMIN)

- Create user without plain password handling.
- System generates one-time reset code/link shown once.
- Admin can generate a new one-time reset code on demand.
- Deactivating a user blocks login and refresh immediately.

## Secret scanning recommendations

Pre-commit scanning:
- `gitleaks`: `gitleaks protect --staged --redact`
- `trufflehog`: `trufflehog git file://. --since-commit HEAD --fail`

GitHub:
- Enable Secret Scanning and Push Protection in repository security settings.
- Rotate any secret immediately if a leak is detected.

## Production checklist

- Serve API and client over HTTPS.
- For cross-site cookie usage, set `COOKIE_SAME_SITE=none` and `Secure=true` (automatic).
- No default passwords in env/docs.
- Use unique, environment-specific secrets and rotate regularly.
- Keep audit logs enabled.
