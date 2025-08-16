import { CodeExecutionService } from './code-execution-service';
import { CodeSubmission } from '../../types/dto/code-execution-types';

describe('CodeExecutionService', () => {
  let codeExecutionService: CodeExecutionService;

  beforeEach(() => {
    codeExecutionService = new CodeExecutionService();
  });

  describe('executeCode', () => {
    it('should execute JavaScript code successfully', async () => {
      const submission: CodeSubmission = {
        source_code: 'console.log("Hello World");',
        language: 'javascript',
      };

      const result = await codeExecutionService.executeCode(submission);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello World');
      expect(result.execution_time_ms).toBeGreaterThan(0);
    });

    it('should execute Python code successfully', async () => {
      const submission: CodeSubmission = {
        source_code: 'print("Hello World")',
        language: 'python',
      };

      const result = await codeExecutionService.executeCode(submission);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello World');
      expect(result.execution_time_ms).toBeGreaterThan(0);
    });

    it('should handle JavaScript syntax errors', async () => {
      const submission: CodeSubmission = {
        source_code: 'console.log("unterminated string',
        language: 'javascript',
      };

      const result = await codeExecutionService.executeCode(submission);

      expect(result.success).toBe(false);
      expect(result.stderr || result.error).toBeDefined();
    });

    it('should handle Python syntax errors', async () => {
      const submission: CodeSubmission = {
        source_code: 'print("unterminated string',
        language: 'python',
      };

      const result = await codeExecutionService.executeCode(submission);

      expect(result.success).toBe(false);
      expect(result.stderr || result.error).toBeDefined();
    });

    it('should handle stdin input for Python', async () => {
      const submission: CodeSubmission = {
        source_code: 'name = input(); print(f"Hello {name}")',
        language: 'python',
        stdin: 'World',
      };

      const result = await codeExecutionService.executeCode(submission);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello World');
    });

    it('should throw error for empty source code', async () => {
      const submission: CodeSubmission = {
        source_code: '',
        language: 'javascript',
      };

      await expect(codeExecutionService.executeCode(submission)).rejects.toThrow('Source code is required');
    });

    it('should throw error for unsupported language', async () => {
      const submission = {
        source_code: 'some code',
        language: 'java',
      } as unknown as CodeSubmission;

      await expect(codeExecutionService.executeCode(submission)).rejects.toThrow('Unsupported language');
    });
  });

  describe('getLanguages', () => {
    it('should return supported languages', async () => {
      const languages = await codeExecutionService.getLanguages();

      expect(languages).toHaveLength(2);
      expect(languages).toEqual([
        { id: 'javascript', name: 'JavaScript (Node.js)', extension: '.js' },
        { id: 'python', name: 'Python 3', extension: '.py' },
      ]);
    });
  });
});