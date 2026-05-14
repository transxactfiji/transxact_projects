# Transxact Projects

Transxact Projects is a Next.js + Drizzle + SQLite workspace app with:

- project, task, and issue workflow tracking
- direct 1:1 in-app messaging
- in-app notifications (bell dropdown + notification center page)
- email notifications with retry queue (Nodemailer)
- in-app admin abuse-report queue

## Requirements

- Node.js 20+
- npm
- SMTP credentials for outgoing email

## Environment variables

Create `.env`:

```bash
DB_FILE_NAME=./transxact.db
JWT_SECRET=replace-with-strong-secret
APP_BASE_URL=http://localhost:3000

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@example.com
SMTP_PASS=replace-with-smtp-password
```

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/` dashboard
- `/projects` project workflow
- `/tasks` task workflow
- `/issues` issue workflow
- `/messages` direct messages
- `/notifications` notification center and preference controls
- `/admin/reports` admin abuse-report queue
- `/auth` login

## Lint and build

```bash
npm run lint
npm run build
```

## Database and migrations

- schema definition: `db/schema.ts`
- compatibility bootstrapping: `db/connection.ts` (`ensureDbSchema`)
- SQL migrations: `drizzle/*.sql`

Apply schema changes with:

```bash
npm run db:push
```

## Notification and email notes

- In-app notifications are stored in `notification`.
- Email notifications are queued in `notification_email_queue`.
- Delivery/read events are recorded in `notification_delivery_log`.
- An authenticated in-app worker periodically processes due email queue items.
