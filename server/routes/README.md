# Routes Directory

This directory contains all route definitions for the CodeGames API.

## Structure

- `main-router.ts` - Central router that orchestrates all route modules
- `index.ts` - Central export file for all route modules
- Individual route files (e.g., `admin-route.ts`, `login-route.ts`)

## Adding New Routes

1. Create a new route file (e.g., `user-route.ts`)
2. Export it in `index.ts`
3. Import and mount it in `main-router.ts`

Example:

```typescript
// user-route.ts
import { Router } from 'express';
const router = Router();

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

export default router;

// index.ts
export { default as userRouter } from './user-route';

// main-router.ts
import { userRouter } from './index';
// ...
this.router.use(`${apiPrefix}/users`, userRouter);
```

## Current Route Structure

- `/health` - Health check endpoint
- `/api/v1/admin/*` - Admin routes
- `/api/v1/auth/*` - Authentication routes

## Rate Limiting

Rate limiting is configured at the Express level in `express-config.ts` for specific endpoints:
- Signup: 5 requests per 15 minutes
- OTP verification: 3 requests per minute
- General: 100 requests per 15 minutes