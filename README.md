# Bittensor Dashboard

MERN app: fetches subnet data from [taostats.io](https://taostats.io) (subnets 1–128), stores in MongoDB, and displays a clean taostats-style table.

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (or set `MONGODB_URI`)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env if needed (PORT, MONGODB_URI)
npm install
npm run dev
```

API runs at **http://localhost:4000**

- `GET /api/subnets` — list all subnets from DB  
- `POST /api/subnets/refresh` — fetch 1–128 from taostats.io (with 300ms delay) and upsert into DB  

### Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:3000** and proxies `/api` to the backend.

## Usage

**Option A – Dev (client + backend separate)**

1. Start MongoDB.
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd client && npm run dev`
4. Open http://localhost:3000 (Vite proxies `/api` to the backend).
5. Click **Refresh** to pull subnet data (1–128); table updates when done.

**Option B – Production (client built, served by backend)**

1. Start MongoDB.
2. Build client: `cd client && npm run build`
3. Start backend: `cd backend && npm start`
4. Open http://localhost:4000 — API and dashboard are served from the same server.

## Field index

See **endpoint.md** for API URL and mapping of dashboard columns to API fields (netuid, name, description, price, active_keys, projected_emission, net_flow_1_day, incentive_burn, neuron_registration_cost).
