# LeetCode Tasks API Testing

Base URL: `{{localhost_url}}{{api_prefix}}/code-execution/execute`

## Get Available Languages

```bash
curl -X GET "{{localhost_url}}{{api_prefix}}/code-execution/languages"
```

Expected Response:
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

## Task 1: Two Sum

### JavaScript Solution Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}\n\n// Test\nconst nums = [2, 7, 11, 15];\nconst target = 9;\nconst result = twoSum(nums, target);\nconsole.log(JSON.stringify(result));",
    "language": "javascript"
  }'
```

### Python Solution Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "def two_sum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []\n\n# Test\nnums = [2, 7, 11, 15]\ntarget = 9\nresult = two_sum(nums, target)\nprint(result)",
    "language": "python"
  }'
```

## Task 2: Palindrome Number

### JavaScript Solution Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "function isPalindrome(x) {\n    if (x < 0) return false;\n    const str = x.toString();\n    return str === str.split(\"\").reverse().join(\"\");\n}\n\n// Test\nconsole.log(isPalindrome(121));\nconsole.log(isPalindrome(-121));\nconsole.log(isPalindrome(10));",
    "language": "javascript"
  }'
```

### Python Solution Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "def is_palindrome(x):\n    if x < 0:\n        return False\n    return str(x) == str(x)[::-1]\n\n# Test\nprint(is_palindrome(121))\nprint(is_palindrome(-121))\nprint(is_palindrome(10))",
    "language": "python"
  }'
```

## Task 3: Valid Parentheses

### JavaScript Solution Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "function isValid(s) {\n    const stack = [];\n    const map = { \")\": \"(\", \"}\": \"{\", \"]\": \"[\" };\n    \n    for (let char of s) {\n        if (char in map) {\n            if (stack.pop() !== map[char]) {\n                return false;\n            }\n        } else {\n            stack.push(char);\n        }\n    }\n    \n    return stack.length === 0;\n}\n\n// Test\nconsole.log(isValid(\"()\"));\nconsole.log(isValid(\"()[]{}\"));\nconsole.log(isValid(\"(]\"));",
    "language": "javascript"
  }'
```

### Python Solution Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "def is_valid(s):\n    stack = []\n    mapping = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    \n    for char in s:\n        if char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return False\n        else:\n            stack.append(char)\n    \n    return len(stack) == 0\n\n# Test\nprint(is_valid(\"()\"))\nprint(is_valid(\"()[]{}\"))\nprint(is_valid(\"(]\"))",
    "language": "python"
  }'
```

## Interactive Test with stdin

### Python Input Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "name = input(\"Enter your name: \")\nprint(f\"Hello, {name}!\")",
    "language": "python",
    "stdin": "Alice"
  }'
```

### JavaScript stdin Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "const readline = require(\"readline\");\nconst rl = readline.createInterface({\n  input: process.stdin,\n  output: process.stdout\n});\n\nrl.question(\"Enter your name: \", (name) => {\n  console.log(`Hello, ${name}!`);\n  rl.close();\n});",
    "language": "javascript",
    "stdin": "Bob"
  }'
```

## Error Handling Tests

### Syntax Error Test (JavaScript)
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello World);",
    "language": "javascript"
  }'
```

### Syntax Error Test (Python)
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello World)",
    "language": "python"
  }'
```

### Invalid Language Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "System.out.println(\"Hello World\");",
    "language": "java"
  }'
```

### Empty Code Test
```bash
curl -X POST "{{localhost_url}}{{api_prefix}}/code-execution/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "",
    "language": "javascript"
  }'
```

## Expected Response Format

Successful execution:
```json
{
  "message": "Code executed successfully",
  "data": {
    "success": true,
    "stdout": "Output here",
    "execution_time_ms": 150
  }
}
```

Failed execution:
```json
{
  "message": "Code executed successfully",
  "data": {
    "success": false,
    "stderr": "Error message here",
    "error": "Process exited with code 1",
    "execution_time_ms": 100
  }
}
```

Validation error:
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