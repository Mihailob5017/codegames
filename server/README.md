# CodeGames Backend Server

The backend server for the CodeGames LeetCode clone, built with Node.js, Express, TypeScript, and Prisma.

## 🏗️ Architecture Overview

The server follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Routes    │  │ Middlewares │  │   Error Handling    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Controller Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Auth     │  │    Admin    │  │       Code Execution Service        │ │
│  │ Controllers │  │ Controllers │  │    Controllers      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Auth     │  │    Email    │  │       Code Execution Service        │ │
│  │  Services   │  │  Services   │  │     Services        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Repository Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Login    │  │    Admin    │  │     External APIs   │ │
│  │ Repository  │ │ Repository  │  │    (Code Execution Service, etc.)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │    Redis    │  │      Code Execution Service DB      │ │
│  │  Database   │  │    Cache    │  │    (Separate)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure Explained

### `/config` - Application Configuration
```typescript
// express-config.ts - Express server setup and middleware configuration
// prisma-config.ts - Database connection and Prisma client setup
```

**Purpose**: Centralized configuration management
**Key Files**:
- `express-config.ts`: CORS, helmet, rate limiting, body parsing
- `prisma-config.ts`: Database connection pooling and client setup

### `/controllers` - HTTP Request Handlers
```
controllers/
├── auth/                      # Authentication endpoints
│   ├── login-controller.ts    # Login, register, OTP verification
│   └── login-controller.test.ts
├── admin/                     # Admin panel endpoints  
│   ├── admin-controller.ts    # User management, system stats
│   └── admin-controller.test.ts
└── code-execution/                    # Code execution endpoints
    ├── code-execution-controller.ts   # Submit code, get results
    └── code-execution-controller.test.ts
```

**Purpose**: Handle HTTP requests, validate input, call services, return responses
**Responsibilities**:
- Request validation using Zod schemas
- Error handling and status codes
- Response formatting
- Authentication checks

**Example Controller Structure**:
```typescript
export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validate input
      const validatedData = loginSchema.parse(req.body);
      
      // 2. Call service
      const result = await authService.login(validatedData);
      
      // 3. Return response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      // 4. Handle errors
      handleControllerError(error, res);
    }
  }
}
```

### `/services` - Business Logic Layer
```
services/
├── auth/                      # Authentication business logic
│   ├── auth-service.ts        # JWT, password hashing, OTP
│   └── auth-service.test.ts
├── admin/                     # Admin functionality
│   ├── admin-service.ts       # User management logic
│   └── admin-service.test.ts
├── email/                     # Email functionality
│   ├── email-service.ts       # Send emails, templates
│   └── email-service.test.ts
└── code-execution/                    # Code execution logic
    ├── code-execution-service.ts      # API communication with Code Execution Service
    └── code-execution-service.test.ts
```

**Purpose**: Implement business rules and logic
**Responsibilities**:
- Business rule validation
- Complex operations and workflows
- External API integration
- Data transformation

**Example Service Structure**:
```typescript
class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    // 1. Validate user exists
    const user = await this.repository.findByEmail(credentials.email);
    if (!user) throw new Error('Invalid credentials');
    
    // 2. Verify password
    const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
    if (!isValid) throw new Error('Invalid credentials');
    
    // 3. Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    
    // 4. Return result
    return { token, user: sanitizeUser(user) };
  }
}
```

### `/repositories` - Data Access Layer
```
repositories/
├── login-repositories.ts      # User authentication data access
├── login-repositories.test.ts
├── admin-repositories.ts      # Admin data access
└── admin-repositories.test.ts
```

**Purpose**: Abstract database operations
**Responsibilities**:
- Database queries using Prisma
- Data mapping and transformation
- Query optimization
- Transaction management

**Example Repository Structure**:
```typescript
export class LoginRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
  }
  
  async createUser(userData: CreateUserData): Promise<User> {
    return await prisma.user.create({
      data: userData,
      include: { profile: true }
    });
  }
}
```

### `/routes` - API Route Definitions
```
routes/
├── main-router.ts             # Central router configuration
├── index.ts                   # Route exports
├── admin-route.ts            # Admin API routes
├── login-route.ts            # Auth API routes
├── code-execution-route.ts           # Code execution routes
└── README.md                 # Route documentation
```

**Purpose**: Define API endpoints and route handling
**Responsibilities**:
- URL mapping to controllers
- Route-level middleware
- Parameter extraction
- Route grouping

**Current API Structure**:
```
/health                        # Health check
/api/v1/auth/
  ├── POST /register           # User registration
  ├── POST /login              # User login
  ├── POST /verify-otp         # Email verification
  └── POST /resend-otp         # Resend OTP
/api/v1/admin/
  ├── GET /users               # Get all users
  └── PUT /users/:id           # Update user
/api/v1/code-execution/
  ├── GET /languages           # Get supported languages
  ├── POST /submit             # Submit code (async)
  ├── GET /result/:token       # Get execution result
  └── POST /execute            # Submit and wait (sync)
```

### `/middlewares` - Express Middlewares
```
middlewares/
├── auth-middleware.ts         # JWT authentication
├── error-middleware.ts        # Global error handling
├── rate-limit-middleware.ts   # API rate limiting
└── global.d.ts               # Global type definitions
```

**Purpose**: Cross-cutting concerns and request processing
**Responsibilities**:
- Authentication verification
- Rate limiting
- Error handling
- Request logging
- Input sanitization

**Middleware Chain**:
```typescript
// Request flow:
Request → Rate Limit → Auth Check → Route Handler → Error Handler → Response
```

### `/prisma` - Database Schema and Migrations
```
prisma/
├── schema.prisma             # Database schema definition
└── migrations/               # Database migration files
    ├── 20250703162602_/
    │   └── migration.sql
    └── migration_lock.toml
```

**Purpose**: Database schema management and versioning
**Current Schema**:
- **Users**: Authentication and profile data
- **Sessions**: User session management
- **OTPs**: One-time password verification
- **Problems**: Coding challenges (future)
- **Submissions**: Code submissions (future)

### `/types` - TypeScript Type Definitions
```
types/
├── common/
│   ├── controller-types.ts    # HTTP response interfaces
│   └── error-types.ts         # Custom error classes
└── dto/
    └── user-types.ts          # Data transfer objects
```

**Purpose**: Type safety and API contracts
**Categories**:
- **DTOs**: Data Transfer Objects for API requests/responses
- **Models**: Database entity types
- **Services**: Business logic interfaces
- **Errors**: Custom error types

### `/utils` - Utility Functions
```
utils/
├── auth.ts                   # Authentication helpers
├── constants.ts              # Application constants
├── helpers.ts                # General utilities
└── request-validator.ts      # Input validation schemas
```

**Purpose**: Shared utility functions and constants
**Examples**:
```typescript
// auth.ts
export const hashPassword = (password: string): Promise<string>
export const generateOTP = (): string
export const verifyJWT = (token: string): JWTPayload

// constants.ts
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  // ...
}
```

### `/templates` - Email Templates
```
templates/
├── html.ts                   # HTML email templates
└── text.ts                   # Plain text email templates
```

**Purpose**: Email content generation
**Features**:
- OTP verification emails
- Welcome emails
- Password reset emails
- Responsive HTML templates

## 🔐 Authentication System Deep Dive

### JWT Authentication Flow
```
1. User Registration
   ├── Email/Password validation
   ├── Password hashing (bcrypt)
   ├── OTP generation and email
   └── Temporary user creation

2. Email Verification
   ├── OTP validation
   ├── User account activation
   └── JWT token generation

3. Login Process
   ├── Credential validation
   ├── Password verification
   ├── JWT token generation
   └── Response with user data

4. Protected Routes
   ├── JWT token extraction
   ├── Token verification
   ├── User context injection
   └── Route access
```

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token generation with expiration
- **Rate Limiting**: Prevents brute force attacks
- **OTP System**: Email-based verification
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configured for frontend origin
- **Helmet**: Security headers

### Rate Limiting Configuration
```typescript
// Login attempts: 5 per 15 minutes
// OTP requests: 3 per minute  
// General API: 100 per 15 minutes
// Registration: 5 per 15 minutes
```

## ⚖️ Code Execution Service Integration Deep Dive

### Code Execution Workflow
```
1. Code Submission
   ├── Input validation (language, source code)
   ├── Security checks
   ├── Code Execution Service API submission
   └── Token return

2. Execution Process (Code Execution Service)
   ├── Source code compilation
   ├── Sandboxed execution
   ├── Output capture
   └── Result storage

3. Result Retrieval
   ├── Token-based lookup
   ├── Status checking
   ├── Output formatting
   └── Response delivery
```

### Supported Languages and IDs
```typescript
const LANGUAGE_IDS = {
  JAVASCRIPT: 63,    // Node.js 12.14.0
  PYTHON: 71,        // Python 3.8.1
  JAVA: 62,          // OpenJDK 13.0.1
  CPP: 54,           // C++ (GCC 9.2.0)
  C: 50,             // C (GCC 9.2.0)
  GO: 60,            // Go 1.13.5
  RUST: 73,          // Rust 1.40.0
  TYPESCRIPT: 74,    // TypeScript 3.7.4
}
```

### Execution Limits
```typescript
interface ExecutionLimits {
  cpu_time_limit: 2;     // seconds
  memory_limit: 128000;  // KB (128MB)
  wall_time_limit: 5;    // seconds
  processes_limit: 60;   // max processes
  enable_per_process_and_thread_time_limit: false;
  enable_per_process_and_thread_memory_limit: true;
  max_file_size: 1024;   // KB
}
```

### Error Handling
```typescript
// Status Codes
const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR: 7,
  INTERNAL_ERROR: 8,
  EXEC_FORMAT_ERROR: 9,
  // ... more statuses
}
```

## 🗄️ Database Architecture

### Prisma Schema Overview
```prisma
// User Management
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  isVerified  Boolean  @default(false)
  role        Role     @default(USER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  otps        OTP[]
  sessions    Session[]
  submissions Submission[]
}

// OTP System
model OTP {
  id        String   @id @default(cuid())
  code      String
  userId    String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

// Future: Problems and Submissions
model Problem {
  id          String   @id @default(cuid())
  title       String
  description String
  difficulty  Difficulty
  testCases   TestCase[]
  submissions Submission[]
}
```

### Database Connections
```typescript
// Main Database (PostgreSQL)
- Host: db:5432
- Database: codegames
- User: postgres
- Features: User data, problems, submissions

// Code Execution Service Database (PostgreSQL)  
- Host: code-execution-db:5432
- Database: code-execution
- User: code-execution
- Features: Code execution data

// Redis Cache
- Host: redis:6379
- Features: Session storage, rate limiting

// Code Execution Service Redis
- Host: code-execution-redis:6379
- Features: Job queues, execution caching
```

## 🧪 Testing Strategy

### Test Structure
```
__tests__/
├── utils/
│   └── test-helpers.ts        # Test utilities and helpers
│
├── unit/                      # Unit tests
│   ├── services/
│   ├── controllers/
│   └── repositories/
│
├── integration/               # Integration tests
│   ├── auth-flow.test.ts
│   ├── code-execution-integration.test.ts
│   └── database.test.ts
│
└── e2e/                       # End-to-end tests
    ├── user-registration.test.ts
    └── code-execution.test.ts
```

### Test Configuration
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/utils/test-helpers.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ]
}
```

### Test Utilities
```typescript
// test-helpers.ts
export const createTestUser = async (): Promise<User>
export const generateJWT = (userId: string): string
export const clearDatabase = async (): Promise<void>
export const mockCode Execution ServiceResponse = (status: number, data: any): void
```

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage

# Specific test file
npm test -- auth-service.test.ts

# Integration tests only
npm test -- --testPathPattern=integration

# With debugging
npm test -- --detectOpenHandles --forceExit
```

## 🔧 Development Guidelines

### Code Style and Standards
```typescript
// 1. Use explicit types
interface UserResponse {
  id: string;
  email: string;
  role: Role;
}

// 2. Error handling
try {
  const result = await service.operation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed:', error);
  throw new ServiceError('Operation failed', 500);
}

// 3. Validation with Zod
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 4. Repository pattern
class UserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }
}
```

### Adding New Features

1. **Create Database Migration**
   ```bash
   npx prisma migrate dev --name add_feature_table
   ```

2. **Add Types**
   ```typescript
   // types/dto/feature-types.ts
   export interface CreateFeatureRequest {
     name: string;
     description: string;
   }
   ```

3. **Create Repository**
   ```typescript
   // repositories/feature-repository.ts
   export class FeatureRepository {
     async create(data: CreateFeatureData): Promise<Feature> {
       return await prisma.feature.create({ data });
     }
   }
   ```

4. **Create Service**
   ```typescript
   // services/feature/feature-service.ts
   export class FeatureService {
     constructor(private repository: FeatureRepository) {}
     
     async createFeature(data: CreateFeatureRequest): Promise<Feature> {
       // Business logic here
       return await this.repository.create(data);
     }
   }
   ```

5. **Create Controller**
   ```typescript
   // controllers/feature/feature-controller.ts
   export class FeatureController {
     async create(req: Request, res: Response): Promise<void> {
       const data = createFeatureSchema.parse(req.body);
       const result = await featureService.createFeature(data);
       res.status(201).json({ success: true, data: result });
     }
   }
   ```

6. **Add Routes**
   ```typescript
   // routes/feature-route.ts
   const router = Router();
   router.post('/', featureController.create.bind(featureController));
   export { router as featureRoute };
   ```

7. **Write Tests**
   ```typescript
   // services/feature/feature-service.test.ts
   describe('FeatureService', () => {
     it('should create feature successfully', async () => {
       const result = await featureService.createFeature(testData);
       expect(result).toBeDefined();
     });
   });
   ```

### Environment Setup

1. **Development Environment**
   ```bash
   # Install dependencies
   npm install
   
   # Set up database
   npm run generate
   npm run migrate
   
   # Start development server
   npm run dev
   ```

2. **Environment Variables**
   ```bash
   # Required variables
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email
   EMAIL_PASS=your-password
   REDIS_URL=redis://localhost:6379
   ```

3. **Docker Development**
   ```bash
   # Start all services
   docker-compose up
   
   # Restart specific service
   docker-compose restart backend
   
   # View logs
   docker-compose logs -f backend
   ```

## 🚨 Error Handling

### Error Types
```typescript
// Custom error classes
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, public errors: any[]) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends HttpError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTH_ERROR');
  }
}
```

### Global Error Handler
```typescript
// middlewares/error-middleware.ts
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
```

## 📊 Monitoring and Logging

### Health Checks
```typescript
// Health check endpoint
GET /health
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "connected",
    "code-execution": "connected"
  }
}
```

### Performance Monitoring
```bash
# Check Docker resource usage
docker stats

# Monitor API performance
curl -w "@curl-format.txt" -s http://localhost:4000/api/auth/login

# Database query performance
npm run prisma:studio
```

## 🔄 CI/CD and Deployment

### Build Process
```bash
# TypeScript compilation
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Database migration
npm run migrate
```

### Docker Production
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

## 📚 API Reference

### Response Format
```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message": string,
  "meta"?: {
    "page": number,
    "limit": number,
    "total": number
  }
}

// Error Response
{
  "success": false,
  "message": string,
  "code"?: string,
  "errors"?: any[]
}
```

### Authentication Headers
```bash
# JWT Token
Authorization: Bearer <jwt_token>

# Content Type
Content-Type: application/json
```

This documentation provides a comprehensive guide for new developers to understand and contribute to the CodeGames backend server. Each section builds upon the previous one, creating a complete picture of the system architecture and development practices.