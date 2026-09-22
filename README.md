# Medicine Reminder

A full-stack app for tracking daily medicines — what to take, how much, and when.
Reminders are grouped by time of day (Morning / Afternoon / Evening / Night), each
with its own color, so a glance at the screen tells you what's next.

**Stack:** React (frontend) · Node.js + Express (backend, REST API) · JSON file storage

---

## Project structure

```
medicine-reminder/
├── server/              Express API
│   ├── server.js
│   ├── data/reminders.json   (created/updated automatically)
│   └── package.json
└── client/              React app
    ├── public/index.html
    ├── src/
    │   ├── App.js / App.css
    │   ├── components/
    │   │   ├── Header.js
    │   │   ├── ReminderCard.js
    │   │   ├── ReminderForm.js
    │   │   └── EmptyState.js
    │   └── timeOfDay.js
    └── package.json
```

## Requirements

- [Node.js](https://nodejs.org) 18 or later (includes npm)

## 1. Start the backend

```bash
cd server
npm install
npm start
```

This runs the API at **http://localhost:5000**. Reminders are stored in
`server/data/reminders.json` — a few sample reminders are included so the app
isn't empty on first run. Delete the file's contents (or reset to `[]`) if you
want to start blank.

## 2. Start the frontend

In a second terminal:

```bash
cd client
npm install
npm start
```

This opens **http://localhost:3000** in your browser. The client is already
configured (via `"proxy"` in `client/package.json`) to forward API calls to the
backend on port 5000, so both need to be running at the same time.

## Features

- **Add, edit, delete** reminders — medicine name, dosage, time, frequency, notes
- **Mark as taken** with one tap; progress shown in the header ("2 of 5 taken today")
- **Color-coded by time of day** — morning (amber), afternoon (blue), evening
  (lavender), night (indigo) — so the schedule is easy to scan at a glance
- **Accessible by design** — large tap targets, visible keyboard focus, the
  Atkinson Hyperlegible typeface (designed for readability, including for
  low-vision users), and screen-reader labels on every control
- **Responsive** — works on phone, tablet, and desktop

## API reference

| Method | Endpoint              | Description                     |
|--------|------------------------|----------------------------------|
| GET    | `/api/reminders`       | List all reminders               |
| POST   | `/api/reminders`       | Create a reminder                |
| PUT    | `/api/reminders/:id`   | Update a reminder (or its `taken` status) |
| DELETE | `/api/reminders/:id`   | Delete a reminder                |

## Next steps you could add

- Browser/push notifications at each reminder's time
- User accounts, so each person has their own list
- A history view of taken/missed doses over time
