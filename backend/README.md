# Malayalamithram Backend API

Express.js REST API for the Malayalamithram News Portal.

## Setup

```bash
cd backend
npm install
npm run dev      # development (nodemon auto-reload)
npm start        # production
```

Runs on **http://localhost:4000**

## Admin Credentials

| Field    | Value         |
|----------|---------------|
| Username | `admin`       |
| Password | `Admin@123`   |

> ⚠️ Change password in `data/store.js` before deploying to production.

## API Endpoints

### Auth
| Method | Path              | Auth | Description            |
|--------|-------------------|------|------------------------|
| POST   | /api/auth/login   | No   | Login, returns JWT     |
| GET    | /api/auth/me      | Yes  | Get current user       |
| POST   | /api/auth/logout  | Yes  | Logout (client drops token) |

### News
| Method | Path            | Auth  | Description        |
|--------|-----------------|-------|--------------------|
| GET    | /api/news       | No    | List news articles |
| GET    | /api/news/:id   | No    | Get single article |
| POST   | /api/news       | Admin | Create article     |
| PUT    | /api/news/:id   | Admin | Update article     |
| DELETE | /api/news/:id   | Admin | Delete article     |

Query params for GET /api/news: `category`, `subcategory`, `featured`, `limit`, `page`

### Categories
| Method | Path                 | Auth  | Description        |
|--------|----------------------|-------|--------------------|
| GET    | /api/categories      | No    | List categories    |
| POST   | /api/categories      | Admin | Create category    |
| PUT    | /api/categories/:id  | Admin | Update category    |
| DELETE | /api/categories/:id  | Admin | Delete category    |

### Auth Header
```
Authorization: Bearer <token>
```

## File Structure

```
backend/
├── server.js           # Entry point
├── package.json
├── middleware/
│   └── auth.js         # JWT verification
├── routes/
│   ├── auth.js         # Login/logout routes
│   ├── news.js         # News CRUD routes
│   └── categories.js   # Category CRUD routes
└── data/
    └── store.js        # In-memory data store
```

## Production Notes

- Replace in-memory store with MongoDB (use `mongoose`)
- Set `JWT_SECRET` env variable to a strong random string
- Set `PORT` env variable (default 4000)
- Update CORS origins in `server.js`
