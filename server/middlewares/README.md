# Optimized Authentication Middleware with Redis Caching

## Overview

This document explains the optimized authentication middleware that uses Redis caching to dramatically improve performance for protected API routes.

## Performance Comparison

### Before (Database on every request)
```
Request → JWT Verification → Database Query (User exists?) → Database Query (User verified?) → Response
Time: ~50-150ms per request
```

### After (Redis caching)
```
Request → JWT Verification → Redis Cache Check → Response
Time: ~5-15ms per request (cache hit)
Time: ~50-150ms per request (cache miss, first time only)
```

## Architecture

### Components
1. **RedisService** (`config/redis-config.ts`) - Redis connection and operations
2. **OptimizedAuthMiddleware** - JWT verification (no caching needed)
3. **OptimizedVerifiedMiddleware** - User verification with Redis caching
4. **UserCacheService** - Cache management utilities

### Cache Strategy
- **Cache Key Pattern**: `user:{userId}`
- **TTL (Time To Live)**: 5 minutes for verified users, 1 minute for invalid users
- **Cache Invalidation**: Manual invalidation when user data changes
- **Fallback**: Always falls back to database on cache miss or Redis failure

## Usage

### Option 1: Use Original Middlewares (Simple)
```typescript
import { AuthMiddleware } from '../middlewares/auth-middleware';
import { VerifiedMiddleware } from '../middlewares/verified-middleware';

router.post('/execute', AuthMiddleware, VerifiedMiddleware, controller);
```

### Option 2: Use Optimized Middlewares (Performance)
```typescript
import { 
  OptimizedAuthMiddleware, 
  OptimizedVerifiedMiddleware 
} from '../middlewares/optimized-auth-middleware';

router.post('/execute', OptimizedAuthMiddleware, OptimizedVerifiedMiddleware, controller);
```

### Option 3: Hybrid Approach (Recommended)
Use optimized middlewares for high-traffic routes, original for low-traffic:

```typescript
// High-traffic routes (code execution, submissions)
router.post('/execute', OptimizedAuthMiddleware, OptimizedVerifiedMiddleware, controller);

// Low-traffic routes (profile updates, settings)
router.put('/profile', AuthMiddleware, VerifiedMiddleware, controller);
```

## Cache Invalidation

### When User Data Changes
Always invalidate cache when user verification status changes:

```typescript
import { UserCacheService } from '../services/cache/user-cache-service';

// When user verifies email
await UserCacheService.updateUserVerification(userId, true);

// When user account is deactivated
await UserCacheService.deactivateUser(userId);

// When user data changes significantly
await UserCacheService.invalidateUser(userId);
```

### Integration Points

#### In Email Verification Service
```typescript
// email-service.ts
export class EmailService {
  async verifyUserEmail(userId: string, token: string): Promise<boolean> {
    // ... verification logic
    
    if (verified) {
      // Update database
      await userRepository.updateVerificationStatus(userId, true);
      
      // Update cache
      await UserCacheService.updateUserVerification(userId, true);
    }
    
    return verified;
  }
}
```

#### In User Management Service
```typescript
// admin-service.ts or user-service.ts
export class AdminService {
  async deactivateUser(userId: string): Promise<void> {
    // Update database
    await userRepository.deactivateUser(userId);
    
    // Invalidate cache
    await UserCacheService.deactivateUser(userId);
  }
}
```

## Configuration

### Environment Variables
```bash
# Redis connection (default: redis://localhost:6379)
REDIS_URL=redis://redis:6379

# Or separate components
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```

### Cache Settings (Tunable)
```typescript
// In optimized-auth-middleware.ts
const USER_CACHE_TTL = 300; // 5 minutes - adjust based on your needs

// Shorter TTL for invalid users (reduces attack surface)
const INVALID_USER_TTL = 60; // 1 minute
```

## Monitoring and Health Checks

### Cache Hit Rate Monitoring
```typescript
// Add to your existing health check endpoint
app.get('/health', async (req, res) => {
  const cacheStats = await UserCacheService.getCacheStats();
  
  res.json({
    status: 'healthy',
    redis: {
      healthy: cacheStats.isHealthy,
      totalKeys: cacheStats.totalKeys,
    },
    // ... other health checks
  });
});
```

### Performance Metrics
Track these metrics in your application monitoring:
- Cache hit rate percentage
- Average response time for cached vs non-cached requests
- Redis connection status
- Database query reduction percentage

## Error Handling

### Redis Failure Scenarios
The middleware gracefully handles Redis failures:

1. **Redis Connection Down**: Falls back to database queries
2. **Cache Miss**: Fetches from database and updates cache
3. **Cache Corruption**: Logs error and falls back to database
4. **Memory Pressure**: Redis automatically evicts old keys (LRU)

### Graceful Degradation
```typescript
// The middleware never fails due to caching issues
try {
  const cachedUser = await getUserFromCache(userId);
  if (cachedUser) {
    return validateCachedUser(cachedUser);
  }
} catch (cacheError) {
  // Log error but continue with database lookup
  console.error('Cache error, falling back to database:', cacheError);
}

// Always fall back to database
const user = await userRepository.getUser(userId);
```

## Performance Benefits

### For Code Execution API
Assuming 1000 requests/hour to `/code-execution/execute`:

**Before Optimization:**
- 1000 database queries/hour for user verification
- Average response time: 100ms
- Database load: High

**After Optimization:**
- ~50 database queries/hour (95% cache hit rate)
- Average response time: 15ms (cache hit), 100ms (cache miss)
- Database load: 95% reduction
- Redis memory usage: ~1MB for 10,000 cached users

### Recommended Cache Tuning
```typescript
// For high-traffic applications
const USER_CACHE_TTL = 600; // 10 minutes

// For security-sensitive applications
const USER_CACHE_TTL = 180; // 3 minutes

// For development/testing
const USER_CACHE_TTL = 60;  // 1 minute
```

## Security Considerations

### Cache Security
- **No Sensitive Data**: Only store verification status, not passwords or PII
- **TTL Limits**: Short TTL reduces impact of stale data
- **Invalidation**: Immediate cache invalidation on security-relevant changes
- **Redis Security**: Use Redis AUTH and network isolation in production

### Attack Mitigation
- **Rate Limiting**: Cache hit/miss doesn't bypass rate limiting
- **Token Validation**: JWT validation still happens on every request
- **Audit Logging**: Cache hits/misses can be logged for security auditing

## Migration Guide

### Step 1: Install Redis Service
Already configured in your `docker-compose.yml`:
```yaml
redis:
  image: redis:7
  ports:
    - '6379:6379'
```

### Step 2: Update Routes Gradually
Start with high-traffic routes:

```typescript
// Update code-execution routes first
import { 
  OptimizedAuthMiddleware, 
  OptimizedVerifiedMiddleware 
} from '../middlewares/optimized-auth-middleware';

router.post('/execute', OptimizedAuthMiddleware, OptimizedVerifiedMiddleware, controller);
```

### Step 3: Add Cache Invalidation
Update services that modify user data:

```typescript
import { UserCacheService } from '../services/cache/user-cache-service';

// Add to existing user update methods
await UserCacheService.invalidateUser(userId);
```

### Step 4: Monitor and Tune
- Monitor cache hit rates
- Adjust TTL based on usage patterns
- Scale Redis if needed

This optimization can reduce database load by 90%+ and improve API response times by 5-10x for cached requests!