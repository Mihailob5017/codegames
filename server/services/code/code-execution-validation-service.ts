import { spawn } from "child_process";
import { HttpError } from "../../types/common/error-types";
import { CodeSecurityValidator } from "../../utils/security/code-security-validator";

export interface CodeValidationRequest {
	code: string;
	language: "javascript" | "python";
	timeLimit?: number;
	memoryLimit?: number;
}

export interface ExecutionResult {
	success: boolean;
	output?: string;
	error?: string;
	executionTime: number;
	memoryUsed?: number;
	securityPassed: boolean;
	validationErrors?: string[];
}

interface ICodeExecutionValidationService {
	validateAndExecuteCode(request: CodeValidationRequest): Promise<ExecutionResult>;
	validateCodeSecurity(code: string, language: string): Promise<boolean>;
	executeSecureCode(code: string, language: string, timeLimit?: number): Promise<Omit<ExecutionResult, 'securityPassed' | 'validationErrors'>>;
}

export class CodeExecutionValidationService implements ICodeExecutionValidationService {
	private readonly supportedLanguages = ["javascript", "python"];
	private readonly defaultTimeLimit = 5000; // 5 seconds
	private readonly defaultMemoryLimit = 128; // 128MB

	async validateAndExecuteCode(request: CodeValidationRequest): Promise<ExecutionResult> {
		const startTime = Date.now();
		const validationErrors: string[] = [];

		try {
			// 1. Validate language support
			this.validateLanguage(request.language);

			// 2. Validate code security
			const securityPassed = await this.validateCodeSecurity(request.code, request.language);
			if (!securityPassed) {
				validationErrors.push("Code failed security validation");
			}

			// 3. Execute code if validation passed
			if (securityPassed && validationErrors.length === 0) {
				const executionResult = await this.executeSecureCode(
					request.code,
					request.language,
					request.timeLimit
				);

				return {
					...executionResult,
					securityPassed,
					validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
				};
			} else {
				return {
					success: false,
					error: "Code validation failed",
					executionTime: Date.now() - startTime,
					securityPassed,
					validationErrors,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown execution error",
				executionTime: Date.now() - startTime,
				securityPassed: false,
				validationErrors: [error instanceof Error ? error.message : "Unknown error"],
			};
		}
	}

	async validateCodeSecurity(code: string, language: string): Promise<boolean> {
		try {
			// Use existing security validator
			CodeSecurityValidator.validateCodeSecurity({
				source_code: code,
				language,
			});

			// Additional language-specific security checks
			this.performLanguageSpecificSecurityChecks(code, language);

			return true;
		} catch (error) {
			console.warn(`Security validation failed: ${error}`);
			return false;
		}
	}

	async executeSecureCode(
		code: string,
		language: string,
		timeLimit = this.defaultTimeLimit
	): Promise<Omit<ExecutionResult, 'securityPassed' | 'validationErrors'>> {
		const startTime = Date.now();

		return new Promise((resolve) => {
			const { command, args } = this.getExecutionCommand(code, language);

			const process = spawn(command, args, {
				timeout: timeLimit,
				killSignal: "SIGKILL",
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let stdout = "";
			let stderr = "";

			process.stdout.on("data", (data) => {
				stdout += data.toString();
			});

			process.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			process.on("close", (code) => {
				const executionTime = Date.now() - startTime;
				resolve({
					success: code === 0,
					output: stdout || undefined,
					error: code !== 0 ? (stderr || `Process exited with code ${code}`) : undefined,
					executionTime,
				});
			});

			process.on("error", (error) => {
				const executionTime = Date.now() - startTime;
				resolve({
					success: false,
					error: error.message,
					executionTime,
				});
			});

			// Handle timeout
			setTimeout(() => {
				if (!process.killed) {
					process.kill("SIGKILL");
					resolve({
						success: false,
						error: "Execution timeout exceeded",
						executionTime: Date.now() - startTime,
					});
				}
			}, timeLimit);
		});
	}

	private validateLanguage(language: string): void {
		if (!this.supportedLanguages.includes(language)) {
			throw new HttpError(400, `Unsupported language: ${language}`);
		}
	}

	private performLanguageSpecificSecurityChecks(code: string, language: string): void {
		switch (language) {
			case "javascript":
				this.validateJavaScriptSecurity(code);
				break;
			case "python":
				this.validatePythonSecurity(code);
				break;
		}
	}

	private validateJavaScriptSecurity(code: string): void {
		const dangerousPatterns = [
			/require\s*\(\s*['"]fs['"]/, // File system access
			/require\s*\(\s*['"]child_process['"]/, // Process spawning
			/require\s*\(\s*['"]net['"]/, // Network access
			/require\s*\(\s*['"]http['"]/, // HTTP requests
			/process\.exit/, // Process control
			/global\./, // Global object access
			/eval\s*\(/, // Code evaluation
			/Function\s*\(/, // Dynamic function creation
			/while\s*\(true\)/, // Infinite loops
			/for\s*\(;;/, // Infinite loops
		];

		for (const pattern of dangerousPatterns) {
			if (pattern.test(code)) {
				throw new Error(`Potentially dangerous JavaScript pattern detected: ${pattern.source}`);
			}
		}

		// Check for function definition - must have a solution function
		if (!code.includes('function solution') && !code.includes('const solution') && !code.includes('let solution')) {
			throw new Error('Code must contain a function named "solution"');
		}
	}

	private validatePythonSecurity(code: string): void {
		const dangerousPatterns = [
			/import\s+os/, // OS access
			/import\s+subprocess/, // Process spawning
			/import\s+sys/, // System access
			/import\s+socket/, // Network access
			/import\s+urllib/, // HTTP requests
			/import\s+requests/, // HTTP requests
			/exec\s*\(/, // Code execution
			/eval\s*\(/, // Code evaluation
			/__import__/, // Dynamic imports
			/open\s*\(/, // File operations
			/while\s+True:/, // Infinite loops
			/while\s+1:/, // Infinite loops
		];

		for (const pattern of dangerousPatterns) {
			if (pattern.test(code)) {
				throw new Error(`Potentially dangerous Python pattern detected: ${pattern.source}`);
			}
		}

		// Check for function definition - must have a solution function
		if (!code.includes('def solution(')) {
			throw new Error('Code must contain a function named "solution"');
		}
	}

	private getExecutionCommand(code: string, language: string): { command: string; args: string[] } {
		switch (language) {
			case "javascript":
				return {
					command: "node",
					args: ["--no-warnings", "-e", code],
				};
			case "python":
				return {
					command: "python3",
					args: ["-c", code],
				};
			default:
				throw new Error(`Unsupported language: ${language}`);
		}
	}
}