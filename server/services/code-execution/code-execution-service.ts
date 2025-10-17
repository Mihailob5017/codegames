import { spawn } from "child_process";
import { HttpError } from "../../types/common/error-types";
import {
	CodeSubmission,
	ExecutionResult,
	Language,
} from "../../types/dto/code-execution-types";
import { CodeSecurityValidator } from "../../utils/security/code-security-validator";

interface ICodeExecutionService {
	getLanguages(): Promise<Language[]>;
	executeCode(submission: CodeSubmission): Promise<ExecutionResult>;
}

export class CodeExecutionService implements ICodeExecutionService {
	private readonly supportedLanguages: Language[] = [
		{ id: "javascript", name: "JavaScript (Node.js)", extension: ".js" },
		{ id: "python", name: "Python 3", extension: ".py" },
	];
	async getLanguages(): Promise<Language[]> {
		return this.supportedLanguages;
	}
	private async validateParams(
		submission: CodeSubmission
	): Promise<CodeExecutionService> {
		if (!submission.source_code) {
			throw new HttpError(400, "Source code is required");
		}
		if (!submission.language) {
			throw new HttpError(400, "Language is required");
		}

		const languages = await this.getLanguages();

		if (!languages.find((l) => l.id === submission.language)) {
			throw new HttpError(400, "Language is not supported");
		}

		return this;
	}

	private checkForInjection(submission: CodeSubmission): CodeExecutionService {
		CodeSecurityValidator.validateCodeSecurity(submission);
		return this;
	}

	public async executeCode(
		submission: CodeSubmission
	): Promise<ExecutionResult> {
		const startTime = Date.now();
		await this.validateParams(submission);
		this.checkForInjection(submission);
		const result = await this.runCode(submission);
		const executionTime = Date.now() - startTime;
		return {
			...result,
			execution_time_ms: executionTime,
		};
	}

	private async runCode(
		submission: CodeSubmission
	): Promise<Omit<ExecutionResult, "execution_time_ms">> {
		return new Promise((resolve) => {
			const { command, args } = this.getExecutionCommand(submission);

			const process = spawn(command, args, {
				timeout: 5000,
				killSignal: "SIGKILL",
			});

			let stdout = "";
			let stderr = "";

			if (submission.stdin) {
				process.stdin.write(submission.stdin);
				process.stdin.end();
			}

			process.stdout.on("data", (data) => {
				stdout += data.toString();
			});

			process.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			process.on("close", (code) => {
				resolve({
					stdout: stdout || undefined,
					stderr: stderr || undefined,
					success: code === 0,
					error: code !== 0 ? `Process exited with code ${code}` : undefined,
				});
			});

			process.on("error", (error) => {
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
			case "javascript":
				return {
					command: "node",
					args: ["-e", submission.source_code],
				};
			case "python":
				return {
					command: "python3",
					args: ["-c", submission.source_code],
				};
			default:
				throw new Error(`Unsupported language: ${submission.language}`);
		}
	}
}

export default CodeExecutionService;
