# codegames-web

React + TypeScript frontend for CodeGames, built with Vite.

## Stack

- React 19 + TypeScript
- Vite (dev server + bundler)
- Monaco Editor (code editing)
- Redux Toolkit + React Redux (state management)
- React Router (routing)
- Axios (HTTP client)
- Formik + Zod (forms + validation)
- i18next (internationalisation)

## Development

The frontend runs inside Docker as part of the Compose stack. Vite's dev server is configured with HMR and a proxy that forwards `/api/*` requests to the backend container.

```bash
# Start via Docker (recommended — runs with the full stack)
docker compose up web

# Or run standalone (needs the API running separately)
npm run dev
```

**Port:** `3000` (configurable via `WEB_PORT` env var)

## Configuration

Vite config reads two environment variables:

| Variable   | Default             | Description              |
|------------|---------------------|--------------------------|
| `WEB_PORT` | `3000`              | Dev server port          |
| `API_URL`  | `http://api:4000`   | Backend URL for proxy    |

Inside Docker, `API_URL` uses the Docker service name (`api`). For standalone development, set it to `http://localhost:4000`.
