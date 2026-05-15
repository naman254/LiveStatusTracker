# Live Status Tracker

A real-time file upload tracker built with Next.js and Express. Upload documents and watch them move through simulated processing stages with live progress updates via WebSocket.

## Live Demo
[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://livestatustracker.namansingh.dev/)


## Features

- Real-time status updates using Socket.IO (no polling)
- Multi-file upload with individual progress bars
- Random failure simulation (~10% chance) to show error handling
- Cancel in-flight jobs
- Jobs persist across page refreshes (localStorage)
- Reconnection with automatic state sync
- Rate limiting on upload/cancel endpoints
- File type validation on both client and server

## Tech Stack

- **Frontend:** Next.js (Pages Router), React 18
- **Backend:** Node.js, Express
- **Real-time:** Socket.IO (WebSocket with polling fallback)
- **File handling:** Multer (memory storage)
- **Styling:** Vanilla CSS

## Project Structure

```
LiveStatusTracker/
├── client/                  # Next.js frontend
│   ├── components/
│   │   ├── JobCard.js
│   │   └── UploadBox.js
│   ├── hooks/
│   │   └── useSocket.js
│   ├── lib/
│   │   └── helpers.js
│   ├── pages/
│   │   ├── _app.js
│   │   ├── _document.js
│   │   └── index.js
│   └── styles/
│       └── globals.css
├── server/                  # Express backend
│   ├── controllers/
│   │   ├── jobsController.js
│   │   └── uploadController.js
│   ├── jobs/
│   │   └── simulateJob.js
│   ├── middleware/
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── jobs.js
│   │   └── upload.js
│   ├── index.js
│   ├── jobsStore.js
│   └── socket.js
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
git clone https://github.com/<your-username>/LiveStatusTracker.git
cd LiveStatusTracker

# Server
cd server
npm install

# Client
cd ../client
npm install
```

Copy the env file and change values if needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API URL for the client |

### Run

Open two terminals:

```bash
# Terminal 1 - backend
cd server
npm run dev

# Terminal 2 - frontend
cd client
npm run dev
```

Open http://localhost:3000



## How It Works

1. User selects files and clicks Submit
2. Client sends `POST /upload` with the file and a `x-client-id` header
3. Server validates the file, creates a job, and returns `202 Accepted` with a `jobId`
4. Server starts `simulateJob()` which walks through processing stages asynchronously
5. At each stage, the server emits a `job:update` event via Socket.IO to the client's room
6. Client receives updates and re-renders the progress bar in real-time

On page refresh, stored jobs are loaded from localStorage and the client emits `catchup` events to re-sync with the server.

### Processing Stages

Each file goes through:

1. **Uploading** (2-3s) - 25%
2. **Scanning** (3-5s) - 50%
3. **Extracting Data** (4-6s) - 75%
4. **Completed** - 100%

About 10% of jobs randomly fail at any stage.

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/upload` | Upload a file. Requires `x-client-id` header. Returns `{ jobId }` |
| `GET` | `/status/:jobId` | Get current job status |
| `POST` | `/cancel/:jobId` | Cancel a job. Requires matching `x-client-id` |
