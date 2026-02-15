# CodeGames - LeetCode Clone

A full-stack LeetCode clone built with React, Node.js, PostgreSQL, and Code Execution Service for code execution. This platform allows users to solve coding problems, submit solutions, and get real-time feedback on their code.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Code Execution Service       │
│   (React)       │    │   (Node.js)     │    │  Code Executor  │
│   Port: 5173    │◄──►│   Port: 4000    │◄──►│   Port: 2358    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Port: 5432    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **Docker & Docker Compose**
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd codegames
   ```

2. **Set up environment variables**

   ```bash
   # Server environment
   cp server/.env.example server/.env

   # Client environment
   cp client/.env.example client/.env
   ```

3. **Start all services**

   ```bash
   npm run app:build  # Build and start all containers
   ```

4. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:4000
   - **Code Execution Service API**: http://localhost:2358

## 📂 Project Structure

```
codegames/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # App entry point
│   │   └── assets/            # Static assets
│   ├── Dockerfile             # Frontend container config
│   └── package.json           # Frontend dependencies
│
├── server/                     # Node.js backend application
│   ├── config/                # Application configuration
│   │   ├── express-config.ts  # Express server setup
│   │   └── prisma-config.ts   # Database configuration
│   │
│   ├── controllers/           # HTTP request handlers
│   │   ├── auth/              # Authentication controllers
│   │   ├── admin/             # Admin panel controllers
│   │   └── code-execution/            # Code execution controllers
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth/              # Authentication services
│   │   ├── admin/             # Admin services
│   │   ├── email/             # Email services
│   │   └── code-execution/            # Code execution services
│   │
│   ├── routes/                # API route definitions
│   │   ├── main-router.ts     # Main router configuration
│   │   ├── auth-route.ts      # Authentication routes
│   │   ├── admin-route.ts     # Admin routes
│   │   └── code-execution-route.ts    # Code execution routes
│   │
│   ├── repositories/          # Data access layer
│   │   ├── login-repositories.ts
│   │   └── admin-repositories.ts
│   │
│   ├── middlewares/           # Express middlewares
│   │   ├── auth-middleware.ts # JWT authentication
│   │   ├── error-middleware.ts# Global error handling
│   │   └── rate-limit-middleware.ts # API rate limiting
│   │
│   ├── prisma/               # Database schema and migrations
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Database migrations
│   │
│   ├── types/                # TypeScript type definitions
│   │   ├── common/           # Shared types
│   │   └── dto/              # Data transfer objects
│   │
│   ├── utils/                # Utility functions
│   │   ├── auth.ts           # Auth helpers
│   │   ├── constants.ts      # App constants
│   │   └── helpers.ts        # General utilities
│   │
│   ├── templates/            # Email templates
│   │   ├── html.ts           # HTML email templates
│   │   └── text.ts           # Plain text templates
│   │
│   ├── Dockerfile            # Backend container config
│   └── package.json          # Backend dependencies
│
├── scripts/                  # Utility scripts
│   └── docker-cleanup.sh     # Docker cleanup script
│
├── docker-compose.yml        # Main Docker Compose config
├── docker-compose.test.yml   # Test environment config
└── package.json              # Root project scripts
```

## 🛠️ Available Scripts

### Root Level Scripts

```bash
# Development
npm run app:up          # Start all services
npm run app:build       # Build and start all services
npm run app:down        # Stop all services
npm run app:test        # Run tests in containers

# Utilities
npm run docker:cleanup  # Clean up Docker resources
npm run docker:status   # Check Docker resource usage
```

### Server Scripts

```bash
cd server

# Development
npm run dev            # Start development server
npm run build          # Build TypeScript
npm run generate       # Generate Prisma client

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode

# Database
npm run migrate        # Run database migrations

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

## 🗄️ Database Setup

The application uses **Prisma** as the ORM with **PostgreSQL**.

### Database Schema

Key entities:

- **Users**: User accounts and authentication
- **Problems**: Coding problems/challenges
- **Submissions**: User code submissions
- **Test Cases**: Problem test cases

### Migration Commands

```bash
cd server

# Generate Prisma client
npm run generate

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

## 🔐 Authentication System

The platform uses **JWT-based authentication** with the following features:

### Components

- **Registration**: Email-based user registration
- **Login**: JWT token generation
- **Email Verification**: OTP-based email verification
- **Password Reset**: Secure password reset flow
- **Rate Limiting**: Protection against brute force attacks

### Middleware

- `auth-middleware.ts`: Validates JWT tokens
- `rate-limit-middleware.ts`: Implements rate limiting

### API Endpoints

```bash
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/verify-otp  # Email verification
POST /api/auth/resend-otp  # Resend OTP (limited to once per 5 minutes)
POST /api/auth/reset-password # Password reset
```

## ⚖️ Code Execution Service Integration

**Code Execution Service** provides secure code execution in 60+ programming languages.

### Architecture

- **Code Execution Service Server**: Main API for submissions
- **Code Execution Service Workers**: Background code execution
- **Code Execution Service Database**: Submission storage
- **Code Execution Service Redis**: Job queue management

### Supported Languages

- JavaScript (Node.js) - ID: 63
- Python 3 - ID: 71
- Java - ID: 62
- C++ - ID: 54
- C - ID: 50
- Go - ID: 60
- Rust - ID: 73

### API Endpoints

```bash
GET  /api/code-execution/languages     # Get supported languages
POST /api/code-execution/submit        # Submit code (async)
GET  /api/code-execution/result/:token # Get execution result
POST /api/code-execution/execute       # Submit and wait (sync)
```

### Example Usage

```bash
# Execute Python code
curl -X POST http://localhost:4000/api/code-execution/execute \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello World!\")",
    "language_id": 71
  }'
```

## 🧪 Testing

### Test Structure

```
server/__tests__/
├── utils/
│   └── test-helpers.ts        # Test utilities
│
├── controllers/               # Controller tests
│   ├── auth/
│   └── admin/
│
├── services/                  # Service tests
│   ├── auth/
│   ├── admin/
│   ├── email/
│   └── code-execution/
│
└── repositories/              # Repository tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- code-execution-service.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests in Docker
npm run app:test
```

## 🌍 Environment Variables

### Server Environment (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codegames"
POSTGRES_DB=codegames
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis
REDIS_URL=redis://localhost:6379

# Code Execution Service
JUDGE0_URL=http://code-execution-server:2358

# Application
NODE_ENV=development
PORT=4000
```

### Client Environment (.env)

```bash
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=CodeGames
```

## 🐳 Docker Configuration

### Services Overview

- **frontend**: React development server
- **backend**: Node.js API server
- **db**: PostgreSQL database
- **redis**: Redis cache
- **code-execution-server**: Code Execution Service API server
- **code-execution-workers**: Code Execution Service execution workers
- **code-execution-db**: Code Execution Service PostgreSQL database
- **code-execution-redis**: Code Execution Service Redis instance

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs code-execution-server

# Restart specific service
docker-compose restart backend

# Rebuild service
docker-compose up --build backend

# Access container shell
docker-compose exec backend bash
```

## 🔧 Development Workflow

### Setting Up Development Environment

1. **Install dependencies**

   ```bash
   # Root dependencies
   npm install

   # Server dependencies
   cd server && npm install

   # Client dependencies
   cd ../client && npm install
   ```

2. **Database setup**

   ```bash
   cd server
   npm run generate    # Generate Prisma client
   npm run migrate     # Run migrations
   ```

3. **Start development servers**

   ```bash
   # Option 1: Docker (recommended)
   npm run app:up

   # Option 2: Local development
   cd server && npm run dev    # Terminal 1
   cd client && npm run dev    # Terminal 2
   ```

### Code Quality

The project enforces code quality through:

- **ESLint**: Code linting
- **TypeScript**: Type safety
- **Jest**: Unit testing
- **Prettier**: Code formatting (configured in ESLint)

### Adding New Features

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow the architecture**
   - Add routes in `server/routes/`
   - Add controllers in `server/controllers/`
   - Add services in `server/services/`
   - Add types in `server/types/`

3. **Write tests**

   ```bash
   # Create test file
   touch server/services/your-service/your-service.test.ts

   # Run tests
   npm test
   ```

4. **Update documentation**
   - Update this README if needed
   - Add inline code comments
   - Update API documentation

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using the port
   lsof -i :4000

   # Kill process
   kill -9 <PID>
   ```

2. **Database connection issues**

   ```bash
   # Check if PostgreSQL is running
   docker-compose ps db

   # View database logs
   docker-compose logs db
   ```

3. **Code Execution Service not responding**

   ```bash
   # Check Code Execution Service services
   docker-compose ps | grep code-execution

   # Restart Code Execution Service
   docker-compose restart code-execution-server code-execution-workers
   ```

4. **Frontend not loading**

   ```bash
   # Check if backend is running
   curl http://localhost:4000/health

   # Check frontend logs
   docker-compose logs frontend
   ```

### Performance Monitoring

```bash
# Check Docker resource usage
npm run docker:status

# Monitor container stats
docker stats

# Check application health
curl http://localhost:4000/health
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend verification OTP

### Code Execution Service Endpoints

- `GET /api/code-execution/languages` - Get supported programming languages
- `POST /api/code-execution/submit` - Submit code for execution
- `GET /api/code-execution/result/:token` - Get execution result
- `POST /api/code-execution/execute` - Submit code and wait for result

### Admin Endpoints

- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Ensure all tests pass before committing

## 📄 License

This project is licensed under the ISC License.

## 🔗 Useful Links

- [Code Execution Service Documentation](https://ce.code-execution.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)
