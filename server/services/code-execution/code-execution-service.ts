import { spawn } from 'child_process';
import { HttpError } from '../../types/common/error-types';
import {
	CodeSubmission,
	ExecutionResult,
	Language,
} from '../../types/dto/code-execution-types';

export class CodeExecutionService {
	private readonly supportedLanguages: Language[] = [
		{ id: 'javascript', name: 'JavaScript (Node.js)', extension: '.js' },
		{ id: 'python', name: 'Python 3', extension: '.py' },
	];

	async executeCode(submission: CodeSubmission): Promise<ExecutionResult> {
		if (!submission.source_code?.trim()) {
			throw new HttpError(400, 'Source code is required');
		}

		if (
			!this.supportedLanguages.find((lang) => lang.id === submission.language)
		) {
			throw new HttpError(400, 'Unsupported language');
		}

		const startTime = Date.now();

		try {
			const result = await this.runCode(submission);
			const executionTime = Date.now() - startTime;

			return {
				...result,
				execution_time_ms: executionTime,
			};
		} catch (error) {
			const executionTime = Date.now() - startTime;
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				execution_time_ms: executionTime,
			};
		}
	}

	async getLanguages(): Promise<Language[]> {
		return this.supportedLanguages;
	}

	private async runCode(
		submission: CodeSubmission
	): Promise<Omit<ExecutionResult, 'execution_time_ms'>> {
		return new Promise((resolve) => {
			const { command, args } = this.getExecutionCommand(submission);

			const process = spawn(command, args, {
				timeout: 5000,
				killSignal: 'SIGKILL',
			});

			let stdout = '';
			let stderr = '';

			if (submission.stdin) {
				process.stdin.write(submission.stdin);
				process.stdin.end();
			}

			process.stdout.on('data', (data) => {
				stdout += data.toString();
			});

			process.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			process.on('close', (code) => {
				resolve({
					stdout: stdout || undefined,
					stderr: stderr || undefined,
					success: code === 0,
					error: code !== 0 ? `Process exited with code ${code}` : undefined,
				});
			});

			process.on('error', (error) => {
				resolve({
					success: false,
					error: error.message,
				});
			});
		});
	}

	private getExecutionCommand(submission: CodeSubmission): {
		command: string;
		args: string[];
	} {
		switch (submission.language) {
			case 'javascript':
				return {
					command: 'node',
					args: ['-e', submission.source_code],
				};
			case 'python':
				return {
					command: 'python3',
					args: ['-c', submission.source_code],
				};
			default:
				throw new Error(`Unsupported language: ${submission.language}`);
		}
	}
}

export default CodeExecutionService;
