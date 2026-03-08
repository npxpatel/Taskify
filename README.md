# Taskify

A job application tracker built for people who are actively job hunting and tired of maintaining a spreadsheet. Track every application, manage tasks around your search, and store email templates — all in one place.

---
## Images for your reference
<img width="1512" height="982" alt="Screenshot 2026-03-08 at 20 04 22" src="https://github.com/user-attachments/assets/5e73ca39-5e99-43d2-8ece-491a6063ce8d" />
<img width="1512" height="982" alt="Screenshot 2026-03-08 at 20 03 24" src="https://github.com/user-attachments/assets/10fbcbf0-0b89-4b45-90b2-52e1efa863b9" />
<img width="1512" height="982" alt="Screenshot 2026-03-08 at 20 03 42" src="https://github.com/user-attachments/assets/652fbe89-b67b-4e66-a335-eaa39ace7914" />
<img width="1512" height="982" alt="Screenshot 2026-03-08 at 20 04 02" src="https://github.com/user-attachments/assets/fa0596b1-3906-409f-9290-924c68f5c1ec" />
<img width="1512" height="982" alt="Screenshot 2026-03-08 at 20 04 09" src="https://github.com/user-attachments/assets/8ab22761-3841-4ca5-9894-b50ea6e801b4" />


## What it does

**Job tracking** — Log every application with the company, role, date, opening type (public / referral / internal), and status (applied → shortlisted → interviews → selected). Company logos are auto-fetched via Clearbit for 60+ companies, and a fuzzy search lets you find a company and pull its logo while adding a new job.

**Task management** — General to-do list with due dates, priority levels (low / medium / high), and descriptions. The dashboard shows what's due today. The tasks page categorises everything into Overdue / Today / Tomorrow / Upcoming tabs.

**Templates** — Store reusable email templates organised by category (cover letter, resume, cold email, follow-up, other) and type (technical, behavioral, general). Ships with 8 sensible defaults that get seeded on first login.

**Stale job reminders** — A cron job runs daily at 9 AM. If you applied to a job and haven't heard back in 14+ days, you get an email reminder listing everything that's gone quiet. The email is sent asynchronously through a RabbitMQ worker — the cron job just publishes a message; a separate worker process sends the actual email.

**Password reset** — Forgot password sends a 6-digit OTP via email (also through the async worker, not inline). OTPs expire after 10 minutes.

---

## Tech

| Layer | What |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Cache | Redis — job lists are cached per-user for 5 minutes, cache is busted on any write |
| Queue | RabbitMQ with two durable queues: `email_notifications` and `job_reminders` |
| Auth | JWT in an HttpOnly cookie, bcrypt with 12 rounds, Zod validation on every input |
| Email | Nodemailer (Gmail) |

Redis and RabbitMQ are both optional — the server starts fine without them, just with caching and queueing disabled.

---

## Running locally

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally (or a connection string to Atlas)
- Redis and RabbitMQ if you want caching/email (optional)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in .env — at minimum MONGO_URI and JWT_SECRET
npm install
npm run dev
```

Runs on `http://localhost:8001`.

To also run the async workers (needed for emails):

```bash
# In separate terminals
npm run dev:worker       # handles OTP and generic emails
npm run dev:reminder     # handles stale job reminder emails
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:8001`.

---

## Environment variables

```bash
# backend/.env

PORT=8001
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/taskify

REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672

JWT_SECRET=something-long-and-random
JWT_EXPIRES_IN=7d

EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password   # use a Gmail App Password, not your account password

CORS_ORIGINS=http://localhost:5173
```

For the frontend, create `frontend/.env.local`:

```bash
VITE_BACKEND_URL=        # leave empty for local (proxy handles it)
                         # set to your deployed backend URL in production
```

---

## API overview

All responses follow `{ success: true, data: T }`. Errors return `{ success: false, message: string }`.

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/jobs
POST   /api/jobs
PATCH  /api/jobs/:jobId
DELETE /api/jobs/:jobId

GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId

GET    /api/templates
POST   /api/templates
PATCH  /api/templates/:templateId
DELETE /api/templates/:templateId
POST   /api/templates/seed-defaults

GET    /api/companies/search?q=<name>

GET    /api/health
```

---

## Project structure

```
backend/src/
├── app.js                  # Express app setup, middleware, routes
├── server.js               # Connects to all services, starts listening
├── config/                 # env validation, database connection, cookie options
├── controllers/            # Route handlers (auth, jobs, tasks, templates, companies)
├── middleware/             # JWT auth, global error handler
├── models/                 # Mongoose schemas (User, Job, Task, Template, Otp)
├── routes/                 # Express routers
├── services/               # Redis client, RabbitMQ client, Nodemailer
├── jobs/                   # staleJobReminder.js — the daily cron
├── workers/                # emailWorker.js, reminderWorker.js — queue consumers
├── types/                  # Zod schemas for all request bodies
└── utils/                  # AppError class, JWT helpers

frontend/src/
├── lib/api.ts              # All API calls, TypeScript interfaces for every model
├── pages/                  # Dashboard, Jobs, Tasks, Templates, Login, etc.
├── components/             # Shared UI — TaskDialog, JobDialog, Layout, etc.
└── components/ui/          # shadcn/ui primitives
```

---

## Deployment

The backend is deployed on **Render** (Singapore), the frontend on **Vercel**.

A few things worth noting if you're deploying:

- Don't set `PORT` manually in Render — it injects it automatically. Setting it yourself means the app listens on a different port than Render expects, and it'll show "No open ports detected".
- Upstash Redis requires `rediss://` (double-s, TLS), not `redis://`.
- If your MongoDB Atlas password contains `@`, URL-encode it as `%40` in the connection string.
- Set `CORS_ORIGINS` to your Vercel URL without a trailing slash.
