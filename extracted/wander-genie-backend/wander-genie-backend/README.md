# 🧞 WanderGenie Backend

Production-ready Node.js + Express + MongoDB backend for the **WanderGenie** AI trip planner.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB (Mongoose 8) |
| Auth | JWT (access + refresh tokens) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| AI (optional) | OpenAI GPT-4o-mini / built-in smart generator |

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 18
- MongoDB running locally or a MongoDB Atlas URI

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Minimum required:

```env
MONGODB_URI=mongodb://localhost:27017/wandergenie
JWT_SECRET=change_this_secret
JWT_REFRESH_SECRET=change_this_too
```

### 4. (Optional) Seed sample data

```bash
npm run seed
```

### 5. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts on **http://localhost:8000** by default.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | HTTP port |
| `NODE_ENV` | `development` | `development` / `production` |
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Access token signing secret |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `JWT_REFRESH_SECRET` | — | Refresh token signing secret |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token lifetime |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `AI_PROVIDER` | _(empty)_ | Set to `openai` to use GPT |
| `OPENAI_API_KEY` | _(empty)_ | OpenAI key (if AI_PROVIDER=openai) |
| `WEATHER_API_KEY` | _(empty)_ | OpenWeatherMap key (optional) |

---

## API Reference

### Health

```
GET /health
```

---

### Authentication  `POST /api/auth/...`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, receive tokens |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | ✅ Bearer | Revoke refresh token |
| GET | `/api/auth/me` | ✅ Bearer | Get current user |
| PATCH | `/api/auth/me` | ✅ Bearer | Update name / avatar |
| PATCH | `/api/auth/change-password` | ✅ Bearer | Change password |

**Register body:**
```json
{ "name": "Aarav", "email": "aarav@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "aarav@example.com", "password": "secret123" }
```

---

### Trip Planner  `POST /api/trips/...`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/trips/generate` | optional | Generate itinerary |
| GET | `/api/trips` | ✅ Bearer | List my trips |
| GET | `/api/trips/saved` | ✅ Bearer | List saved trips |
| GET | `/api/trips/:id` | optional | Get trip by ID |
| PATCH | `/api/trips/:id/save` | ✅ Bearer | Toggle save |
| DELETE | `/api/trips/:id` | ✅ Bearer | Delete trip |

**Generate body (matches frontend TripRequest):**
```json
{
  "destination": "Goa",
  "budget": 25000,
  "duration": 5,
  "interests": ["beaches", "nightlife", "cafes"]
}
```

**Valid interests:** `beaches` · `cafes` · `nightlife` · `adventure` · `mountains` · `culture` · `shopping`

**Generate response:**
```json
{
  "success": true,
  "message": "Itinerary generated",
  "data": {
    "trip": {
      "_id": "...",
      "destination": "Goa",
      "budget": 25000,
      "duration": 5,
      "interests": ["beaches", "nightlife"],
      "itinerary": [
        { "day": 1, "title": "Day 1 — Arrival & First Impressions", "activities": ["..."] }
      ],
      "packing_list": [{ "name": "Clothing", "items": ["..."] }],
      "weather": { "temperature": "30°C", "condition": "Sunny", "rainPrediction": "20%", "suggestion": "..." }
    }
  }
}
```

---

### Legacy endpoint (matches existing frontend config)

```
POST /generate-itinerary
```

Same body and response as `/api/trips/generate`. 
Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in the frontend `.env.local`.

---

## Folder Structure

```
wander-genie-backend/
├── scripts/
│   └── seed.js               # Sample data seeder
├── src/
│   ├── config/
│   │   ├── constants.js       # Interest options, budget tiers
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Register, login, me, password
│   │   └── tripController.js  # Generate, list, save, delete
│   ├── middleware/
│   │   ├── auth.js            # protect + optionalAuth
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # express-validator runner
│   ├── models/
│   │   ├── Trip.js            # Trip schema + sub-schemas
│   │   └── User.js            # User schema with bcrypt hook
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tripRoutes.js
│   │   └── index.js           # Root router + legacy endpoint
│   ├── services/
│   │   └── itineraryService.js # Smart generator + OpenAI fallback
│   ├── utils/
│   │   ├── jwt.js             # Sign / verify helpers
│   │   └── response.js        # Unified API response helpers
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── tripValidators.js
│   └── server.js              # Express app entry point
├── .env.example
├── package.json
└── README.md
```

---

## Connecting the Frontend

In `wander-genie/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false
```

The frontend calls `POST /generate-itinerary` which is aliased to the full trip generation pipeline.

---

## AI Provider

By default, the backend uses a **built-in smart generator** that creates personalised itineraries, packing lists, and weather summaries based on destination knowledge and interest profiles — no API key needed.

To upgrade to **OpenAI GPT-4o-mini**, set:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

The OpenAI path automatically falls back to the built-in generator if the API call fails.

---

## License

MIT
