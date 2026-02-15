import { HttpError } from "../../types/common/error-types";

export interface CodeExecutionRequest {
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
}

const LANGUAGE_IDS: Record<string, number> = {
	javascript: 63,
	python: 71,
};

const JUDGE0_STATUS = {
	ACCEPTED: 3,
	TIME_LIMIT_EXCEEDED: 5,
	COMPILATION_ERROR: 6,
} as const;

interface Judge0Response {
	stdout: string | null;
	stderr: string | null;
	compile_output: string | null;
	status: { id: number; description: string };
	time: string | null;
	memory: number | null;
}

export class Judge0Service {
	private readonly baseUrl: string;
	private readonly defaultTimeLimitSec = 5;
	private readonly defaultMemoryLimitKb = 128_000;

	constructor() {
		this.baseUrl =
			process.env.JUDGE0_API_URL || "http://judge0-server:2358";
	}

	async execute(request: CodeExecutionRequest): Promise<ExecutionResult> {
		const languageId = LANGUAGE_IDS[request.language];
		if (!languageId) {
			throw new HttpError(400, `Unsupported language: ${request.language}`);
		}

		const body = {
			source_code: request.code,
			language_id: languageId,
			cpu_time_limit: request.timeLimit
				? request.timeLimit / 1000
				: this.defaultTimeLimitSec,
			memory_limit: request.memoryLimit ?? this.defaultMemoryLimitKb,
		};

		try {
			const response = await fetch(
				`${this.baseUrl}/submissions?base64_encoded=false&wait=true`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				}
			);

			if (!response.ok) {
				throw new HttpError(502, `Judge0 returned status ${response.status}`);
			}

			const data: Judge0Response = await response.json();
			return this.mapResponse(data);
		} catch (error) {
			if (error instanceof HttpError) throw error;
			const message =
				error instanceof Error ? error.message : "Unknown error";
			throw new HttpError(502, `Judge0 service unavailable: ${message}`);
		}
	}

	private mapResponse(data: Judge0Response): ExecutionResult {
		const executionTime = data.time
			? Number.parseFloat(data.time) * 1000
			: 0;
		const memoryUsed = data.memory ?? undefined;
		const statusId = data.status.id;

		if (statusId === JUDGE0_STATUS.ACCEPTED) {
			return {
				success: true,
				output: data.stdout?.trimEnd() || undefined,
				executionTime,
				memoryUsed,
			};
		}

		let error: string;
		if (statusId === JUDGE0_STATUS.COMPILATION_ERROR) {
			error = data.compile_output || "Compilation error";
		} else if (statusId === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED) {
			error = "Execution timeout exceeded";
		} else {
			error = data.stderr || data.status.description;
		}

		return { success: false, error, executionTime, memoryUsed };
	}
}
