# Code Execution Service

## Overview

The Code Execution Service provides a simple, secure way to execute JavaScript and Python code for a LeetCode-style coding platform. It uses Node.js `child_process.spawn` to execute code directly on the system with timeout protection and proper error handling.

## Architecture

```
CodeExecutionController
    ↓
CodeExecutionService
    ↓
Node.js child_process.spawn
    ↓
JavaScript (node -e) / Python (python3 -c)
```

## Features

- ✅ **Two Languages**: JavaScript (Node.js) and Python 3
- ✅ **Timeout Protection**: 5-second execution limit
- ✅ **stdin Support**: Handle interactive input
- ✅ **Error Handling**: Syntax errors, runtime errors, and timeouts
- ✅ **Execution Metrics**: Track execution time in milliseconds
- ✅ **Security**: Process isolation with kill signals

## API Endpoints

### GET `/api/v1/code-execution/languages`
Returns list of supported programming languages.

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

### POST `/api/v1/code-execution/execute`
Executes the provided source code.

**Request Body:**
```json
{
  "source_code": "console.log('Hello World');",
  "language": "javascript",
  "stdin": "optional input data"
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

## Code Execution Flow

### 1. Validation
- Check if source code is provided and not empty
- Validate language is supported (javascript or python)
- Parse request body with Zod schema validation

### 2. Code Execution
```typescript
// JavaScript execution
node -e "console.log('Hello World');"

// Python execution  
python3 -c "print('Hello World')"
```

### 3. Process Management
- **Timeout**: 5000ms (5 seconds)
- **Kill Signal**: SIGKILL for forceful termination
- **stdin**: Optional input data piped to process
- **stdout/stderr**: Captured and returned in response

### 4. Result Processing
- Track execution time from start to finish
- Determine success based on exit code (0 = success)
- Format response with execution results

## Security Considerations

### Process Isolation
- Each code execution runs in a separate child process
- Processes are killed after timeout to prevent resource exhaustion
- No file system access beyond what Node.js/Python allows

### Input Validation
- Strict schema validation using Zod
- Language whitelist (only javascript/python allowed)
- Source code required and non-empty

### Resource Limits
- **Time Limit**: 5 seconds maximum execution
- **Memory**: Inherited from system (consider adding memory limits)
- **Network**: No explicit restrictions (consider blocking network access)

## Error Handling

### Validation Errors (400)
```json
{
  "message": "Validation error",
  "data": [
    {
      "code": "invalid_enum_value",
      "expected": ["javascript", "python"],
      "received": "java",
      "path": ["language"],
      "message": "Language must be either \"javascript\" or \"python\""
    }
  ]
}
```

### Execution Errors
- **Syntax Errors**: Captured in stderr
- **Runtime Errors**: Captured in stderr with exit code
- **Timeouts**: Process killed, timeout error returned
- **System Errors**: spawn failures handled gracefully

## Usage Examples

### Two Sum Problem (JavaScript)
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

### Interactive Input (Python)
```python
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

With stdin: `"Alice"` → Output: `"Hello, Alice!"`

## Dependencies

### Required System Dependencies
- **Node.js**: For JavaScript execution
- **Python 3**: For Python execution
- **child_process**: Built-in Node.js module (no install needed)

### NPM Dependencies
- **zod**: Schema validation
- **express**: Web framework (inherited from project)

## Configuration

### Environment Variables
None required - service uses system-installed Node.js and Python.

### Customization Options
```typescript
// Modify timeout in CodeExecutionService
const process = spawn(command, args, {
  timeout: 5000, // Change timeout here
  killSignal: 'SIGKILL',
});
```

## Testing

### Unit Tests
- Located in `code-execution-service.test.ts`
- Tests successful execution for both languages
- Tests error scenarios (syntax errors, empty code, invalid language)
- Tests stdin input handling

### Integration Tests
- Use Postman collection: `LeetCode-Tasks.postman_collection.json`
- Test all 8 LeetCode problems with solutions
- Test error handling and edge cases

## Performance Considerations

### Execution Time
- JavaScript: ~50-200ms for simple operations
- Python: ~100-300ms for simple operations
- Complex algorithms may take longer but are capped at 5 seconds

### Memory Usage
- Each process inherits system memory limits
- Consider adding explicit memory limits for production:
```bash
# Example memory limit (not implemented)
ulimit -v 128000  # 128MB virtual memory limit
```

### Scalability
- Each request spawns a new process
- Consider process pooling for high-traffic scenarios
- Monitor system resources under load

## Future Enhancements

### Security Improvements
- [ ] Add memory limits per execution
- [ ] Implement network access restrictions
- [ ] Add file system sandboxing
- [ ] Input sanitization for malicious code

### Feature Additions
- [ ] Support for more languages (Java, C++, Go)
- [ ] Code execution statistics and analytics
- [ ] Test case validation and scoring
- [ ] Submission history and caching

### Performance Optimizations
- [ ] Process pooling for faster execution
- [ ] Result caching for identical submissions
- [ ] Resource usage monitoring and alerting