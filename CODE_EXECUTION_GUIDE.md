# Code Execution Service - Complete Guide

## Overview

This guide documents the complete code execution system for your LeetCode clone, which has been simplified from an external Judge0 service to a lightweight, built-in solution using Node.js and Python.

## Architecture Changes

### Before (External Judge0)

```
Frontend → Backend → Judge0 Service (Port 2358) → Docker Container Execution
```

### After (Simplified Built-in)

```
Frontend → Backend → CodeExecutionService → Node.js/Python child_process
```

## System Components

### 1. Core Service Files

```
server/services/code-execution/
├── code-execution-service.ts           # Main execution logic
├── code-execution-service.test.ts      # Unit tests
└── README.md                          # Detailed service documentation
```

### 2. API Layer

```
server/controllers/code-execution/
├── code-execution-controller.ts        # HTTP endpoints
└── code-execution-controller.test.ts   # Controller tests

server/routes/
└── code-execution-route.ts            # Route definitions

server/types/dto/
└── code-execution-types.ts            # TypeScript interfaces
```

### 3. Testing & Documentation

```
├── LeetCode-Tasks.postman_collection.json  # Postman API tests
├── leetcode-tasks.json                     # Task definitions
├── test-api-calls.md                       # curl examples
└── CODE_EXECUTION_GUIDE.md                 # This guide
```

## API Documentation

### Base URL

```
{{localhost_url}}/{{api_prefix}}/code-execution
```

### Endpoints

#### GET `/languages`

Returns supported programming languages.

**Response:**

```json
{
	"message": "Supported languages retrieved successfully",
	"data": [
		{
			"id": "javascript",
			"name": "JavaScript (Node.js)",
			"extension": ".js"
		},
		{
			"id": "python",
			"name": "Python 3",
			"extension": ".py"
		}
	]
}
```

#### POST `/execute`

Executes code and returns results.

**Request:**

```json
{
	"source_code": "console.log('Hello World');",
	"language": "javascript",
	"stdin": "optional input"
}
```

**Success Response:**

```json
{
	"message": "Code executed successfully",
	"data": {
		"success": true,
		"stdout": "Hello World\n",
		"execution_time_ms": 150
	}
}
```

**Error Response:**

```json
{
	"message": "Code executed successfully",
	"data": {
		"success": false,
		"stderr": "SyntaxError: Unexpected token",
		"error": "Process exited with code 1",
		"execution_time_ms": 100
	}
}
```

## Security Features

### Process Isolation

- Each execution runs in a separate child process
- Automatic process termination after 5 seconds
- SIGKILL signal for forceful cleanup

### Input Validation

- Zod schema validation for all inputs
- Language whitelist (only javascript/python)
- Required source code validation

### Resource Protection

- **Timeout**: 5-second maximum execution time
- **Memory**: Inherits system limits (configurable)
- **Network**: No explicit restrictions (can be added)

## Installation & Setup

### 1. System Requirements

```bash
# Required on host system or Docker container
node --version    # v18+ recommended
python3 --version # 3.8+ recommended
```

### 2. Docker Setup

The Dockerfile automatically installs Node.js and Python:

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache bash python3
```

### 3. Dependencies

All required dependencies are in `package.json`:

- **zod**: Input validation
- **express**: Web framework
- **child_process**: Built-in Node.js (no install needed)

### 4. Environment Variables

No special environment variables required for code execution.

## Usage Examples

### JavaScript Two Sum

```javascript
function twoSum(nums, target) {
	const map = new Map();
	for (let i = 0; i < nums.length; i++) {
		const complement = target - nums[i];
		if (map.has(complement)) {
			return [map.get(complement), i];
		}
		map.set(nums[i], i);
	}
	return [];
}

const result = twoSum([2, 7, 11, 15], 9);
console.log(JSON.stringify(result)); // [0,1]
```

### Python Interactive Input

```python
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

With `stdin: "Alice"` → Output: `"Hello, Alice!"`

## Testing

### Unit Tests

```bash
npm test
```

Tests cover:

- ✅ Successful execution (JS & Python)
- ✅ Syntax error handling
- ✅ Empty code validation
- ✅ Invalid language validation
- ✅ stdin input processing

### Postman Collection

Import `LeetCode-Tasks.postman_collection.json` for comprehensive API testing:

- All 8 LeetCode problems
- Error handling scenarios
- Interactive input tests

### Manual Testing

```bash
curl -X POST "http://localhost:4000/api/v1/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello World\")",
    "language": "python"
  }'
```

## Performance Characteristics

### Execution Times

- **JavaScript**: ~50-200ms for simple operations
- **Python**: ~100-300ms for simple operations
- **Complex algorithms**: Varies, capped at 5 seconds

### Resource Usage

- **Memory**: System default (consider adding limits)
- **CPU**: Single core per execution
- **Disk**: Minimal (no file writes)

### Scalability

- Each request spawns new process
- Consider process pooling for high traffic
- Monitor system resources under load

## Configuration Options

### Timeout Adjustment

```typescript
// In CodeExecutionService.ts
const process = spawn(command, args, {
	timeout: 5000, // Modify this value
	killSignal: 'SIGKILL',
});
```

### Adding Memory Limits

```bash
# Example: Add to Dockerfile
RUN echo "* soft as 128000" >> /etc/security/limits.conf
RUN echo "* hard as 128000" >> /etc/security/limits.conf
```

### Adding New Languages

```typescript
// In CodeExecutionService.ts
private readonly supportedLanguages: Language[] = [
  { id: 'javascript', name: 'JavaScript (Node.js)', extension: '.js' },
  { id: 'python', name: 'Python 3', extension: '.py' },
  // Add new languages here
];

private getExecutionCommand(submission: CodeSubmission) {
  switch (submission.language) {
    case 'javascript':
      return { command: 'node', args: ['-e', submission.source_code] };
    case 'python':
      return { command: 'python3', args: ['-c', submission.source_code] };
    // Add new language cases here
  }
}
```

## Cleanup Summary

### Removed Components

- ✅ **Judge0 Docker service** - No longer needed
- ✅ **External API calls** - Replaced with local execution
- ✅ **Port 2358 dependency** - Service runs locally
- ✅ **Complex polling logic** - Direct execution results

### Kept Components

- ✅ **Prisma & Database** - Still needed for user auth and data
- ✅ **Redis** - Still used for caching and sessions
- ✅ **Email service** - Still needed for user notifications
- ✅ **Authentication** - Core platform feature

### Updated Components

- ✅ **Docker Compose** - Removed Judge0 service dependency
- ✅ **Dockerfile** - Still installs Python for local execution
- ✅ **Package.json** - No changes needed (all deps still used)

## Monitoring & Maintenance

### Health Checks

Monitor the `/health` endpoint to ensure service availability.

### Log Monitoring

Watch for:

- Process spawn failures
- Timeout occurrences
- Memory usage spikes
- Syntax error patterns

### Performance Monitoring

Track:

- Average execution times by language
- Success/failure rates
- Resource usage trends
- Concurrent execution counts

## Future Enhancements

### Security Improvements

- [ ] Memory limits per execution
- [ ] Network access restrictions
- [ ] File system sandboxing
- [ ] Code sanitization

### Feature Additions

- [ ] More programming languages (Java, C++, Go)
- [ ] Test case validation and scoring
- [ ] Execution result caching
- [ ] Real-time collaboration features

### Performance Optimizations

- [ ] Process pooling for faster execution
- [ ] Result caching for identical submissions
- [ ] Load balancing for high traffic
- [ ] Async execution queuing

This simplified architecture provides a robust, maintainable code execution system that's perfect for your LeetCode clone while being much easier to deploy and manage than the previous external service approach.
