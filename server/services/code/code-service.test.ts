import { CodeService } from './code-service';
import { CodePreparationService } from './code-preparation-service';
import { CodeExecutionValidationService } from './code-execution-validation-service';
import { CodeRepository } from '../../repositories/code/code-respositories';

// Mock the dependencies
jest.mock('./code-preparation-service');
jest.mock('./code-execution-validation-service');
jest.mock('../../repositories/code/code-respositories');

describe('CodeService', () => {
  let codeService: CodeService;
  let mockCodePreparationService: jest.Mocked<CodePreparationService>;
  let mockCodeExecutionService: jest.Mocked<CodeExecutionValidationService>;
  let mockCodeRepository: jest.Mocked<CodeRepository>;

  beforeEach(() => {
    codeService = new CodeService();
    mockCodePreparationService = codeService['codePreparationService'] as jest.Mocked<CodePreparationService>;
    mockCodeExecutionService = codeService['codeExecutionService'] as jest.Mocked<CodeExecutionValidationService>;
    mockCodeRepository = codeService['codeRepository'] as jest.Mocked<CodeRepository>;
  });

  describe('runSingleTestCase', () => {
    it('should successfully run a test case', async () => {
      // Arrange
      const request = {
        problemId: 'test-problem',
        userCode: 'function solution(nums, target) { return [0, 1]; }',
        language: 'javascript' as const,
      };

      const mockPreparedData = {
        problem: { 
          id: 'test-problem', 
          title: 'Test Problem',
          description: 'Test description',
          hints: [],
          explanation: 'Test explanation',
          examples: [],
          difficulty: 'EASY' as any,
          type: 'ALGORITHM' as any,
          accessLevel: 'PUBLIC' as any,
          tags: [],
          testCases: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        testCase: { 
          id: 'test-case-1', 
          problemId: 'test-problem',
          input: '[2,7,11,15]\n9', 
          expectedOutput: '[0,1]',
          isExample: true,
          isHidden: false,
          timeLimit: 5000,
          memoryLimit: 128
        },
        allTestCases: [],
        preparedCode: 'wrapped code',
        language: 'javascript',
        originalCode: request.userCode,
        problemId: request.problemId,
      } as any;

      const mockExecutionResult = {
        success: true,
        output: '{"success":true,"output":[0,1],"expected":[0,1],"passed":true}',
        executionTime: 100,
        securityPassed: true,
      };

      mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(mockPreparedData);
      mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue(mockExecutionResult);

      // Act
      const result = await codeService.runSingleTestCase(request);

      // Assert
      expect(result).toEqual({
        testCaseId: 'test-case-1',
        passed: true,
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        actualOutput: [0, 1],
        executionTime: 100,
        error: undefined,
      });

      expect(mockCodePreparationService.prepareCodeForExecution).toHaveBeenCalledWith({
        problemId: request.problemId,
        userCode: request.userCode,
        language: request.language,
      });

      expect(mockCodeExecutionService.validateAndExecuteCode).toHaveBeenCalledWith({
        code: 'wrapped code',
        language: request.language,
        timeLimit: 5000,
      });
    });

    it('should handle execution failure', async () => {
      // Arrange
      const request = {
        problemId: 'test-problem',
        userCode: 'function solution(nums, target) { return [0, 1]; }',
        language: 'javascript' as const,
      };

      const mockPreparedData = {
        problem: { 
          id: 'test-problem', 
          title: 'Test Problem',
          description: 'Test description',
          hints: [],
          explanation: 'Test explanation',
          examples: [],
          difficulty: 'EASY' as any,
          type: 'ALGORITHM' as any,
          accessLevel: 'PUBLIC' as any,
          tags: [],
          testCases: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        testCase: { 
          id: 'test-case-1', 
          problemId: 'test-problem',
          input: '[2,7,11,15]\n9', 
          expectedOutput: '[0,1]',
          isExample: true,
          isHidden: false,
          timeLimit: 5000,
          memoryLimit: 128
        },
        allTestCases: [],
        preparedCode: 'wrapped code',
        language: 'javascript',
        originalCode: request.userCode,
        problemId: request.problemId,
      } as any;

      const mockExecutionResult = {
        success: false,
        error: 'Runtime error',
        executionTime: 50,
        securityPassed: true,
      };

      mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(mockPreparedData);
      mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue(mockExecutionResult);

      // Act
      const result = await codeService.runSingleTestCase(request);

      // Assert
      expect(result).toEqual({
        testCaseId: 'test-case-1',
        passed: false,
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        actualOutput: undefined,
        executionTime: 50,
        error: 'Runtime error',
      });
    });

    it('should handle preparation service errors', async () => {
      // Arrange
      const request = {
        problemId: 'non-existent-problem',
        userCode: 'function solution(nums, target) { return [0, 1]; }',
        language: 'javascript' as const,
      };

      mockCodePreparationService.prepareCodeForExecution.mockRejectedValue(
        new Error('Problem not found')
      );

      // Act & Assert
      await expect(codeService.runSingleTestCase(request)).rejects.toThrow(
        'Failed to run test case: Problem not found'
      );
    });
  });

  describe('parseInputParameters', () => {
    it('should parse newline-separated input correctly', () => {
      const input = '[2,7,11,15]\n9';
      const result = codeService['parseInputParameters'](input);
      
      expect(result).toEqual([[2, 7, 11, 15], 9]);
    });

    it('should handle single parameter', () => {
      const input = '[1,2,3]';
      const result = codeService['parseInputParameters'](input);
      
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle array input', () => {
      const input = [[1, 2, 3], 5];
      const result = codeService['parseInputParameters'](input);
      
      expect(result).toEqual([[1, 2, 3], 5]);
    });

    it('should handle non-string, non-array input', () => {
      const input = 42;
      const result = codeService['parseInputParameters'](input);
      
      expect(result).toEqual([42]);
    });
  });
});