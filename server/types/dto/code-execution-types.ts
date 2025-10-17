export interface CodeSubmission {
	source_code: string;
	language: "javascript" | "python";
	stdin?: string;
}

export interface ExecutionResult {
	stdout?: string;
	stderr?: string;
	success: boolean;
	error?: string;
	execution_time_ms: number;
}

export interface Language {
	id: string;
	name: string;
	extension: string;
}
