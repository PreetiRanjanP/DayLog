# DayLog

A clean, daily task and study tracker built with vanilla HTML/CSS/JS, Vercel serverless functions, and MongoDB Atlas.

![DayLog screenshot — plan tab with 90-minute time blocks and a study tracker](https://img.shields.io/badge/stack-Vercel%20%2B%20MongoDB-blue)

---

## Features

- **10 × 90-minute time blocks** (06:00–21:00) with status, progress, and report
- **Study tracker** — log subjects, topics, key notes, and minutes studied
- **Global search** across all dates, tasks, and study entries
- **Auto-save** with 500 ms debounce (no save button)
- **Dark mode** via `prefers-color-scheme`
- **Fully responsive** down to 320 px
- **Optional access key** (APP_KEY) for simple auth

---

## Quick Start (local)

```bash
# 1. Clone and install
git clone <your-repo-url> daylog && cd daylog
npm install

# 2. Create your .env from the template
cp .env.example .env
# Edit .env and paste your MongoDB Atlas connection string

# 3. Run the dev server (no Vercel login needed)
npm run dev
# Open http://localhost:3000
```

---

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and **create a free M0 cluster**.
2. Under **Database Access**, create a database user with a strong password.
3. Under **Network Access**, click **Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`).
   > Vercel functions run from dynamic IP addresses, so you must allow all IPs.
4. Click **Connect → Drivers** and copy the connection string. It looks like:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Paste it as the `MONGODB_URI` value in your `.env` file (or in Vercel env vars).

---

## Deploy to Vercel

1. Push the repo to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Set **Framework Preset** to **Other**.
4. Leave **Build Command** blank and **Output Directory** blank (vercel.json handles it).
5. Under **Environment Variables**, add:

   | Variable      | Value                            |
   | ------------- | -------------------------------- |
   | `MONGODB_URI` | Your Atlas connection string     |
   | `MONGODB_DB`  | `daylog` (or any name you like)  |
   | `APP_KEY`     | *(optional)* a secret access key |

6. Click **Deploy**. Done!

---

## How to Test — Checklist

| # | Test | Steps |
|---|------|-------|
| 1 | **Load today** | Open the app → date bar shows today, slots render |
| 2 | **Navigate dates** | Click Prev / Next / pick a date → data reloads |
| 3 | **Create a task** | Type a title in a slot → wait 0.5 s → reload → data persists |
| 4 | **Update status** | Change status to "Done" → progress jumps to 100%, border turns green |
| 5 | **Clear a slot** | Click Clear → fields reset, record deleted in DB |
| 6 | **Now tag** | View today → the current 90-min slot shows a "NOW" badge |
| 7 | **Stats** | Fill in several slots → stat cards update live |
| 8 | **Add study entry** | Switch to Study tab → fill form → click Add entry → entry appears |
| 9 | **Edit study entry** | Click Edit → form populates, button says "Update entry" → change and submit |
| 10 | **Delete study entry** | Click Delete → confirm dialog → entry removed |
| 11 | **Search** | Type a keyword in the header search → results appear with highlights |
| 12 | **Search navigation** | Click a result → jumps to that date and correct tab |
| 13 | **Auth key** | Set APP_KEY in env → refresh → prompted for key on first request |
| 14 | **Dark mode** | Toggle OS dark mode → app switches themes |
| 15 | **Mobile** | Resize to < 560 px → layout stacks correctly |

---

## Project Structure

```
daylog/
├── public/
│   └── index.html          Single-file frontend (HTML + CSS + JS)
├── api/
│   ├── tasks.js             CRUD for 90-min task blocks
│   ├── study.js             CRUD for study entries
│   └── search.js            Global keyword search
├── lib/
│   └── db.js                Mongo connection, auth guard, validators
├── vercel.json              Vercel routing config
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Phase 2 Ideas (not built yet)

- JSON export / import
- Weekly summary chart
- Streak counter
- Browser reminders every 90 minutes
- Tags / categories
- Recurring tasks
- Real user accounts (replacing APP_KEY)

---

## License

MIT
