import { Language } from "@prisma/client";
import { ExternalServiceError } from "../shared/errors/app-error";

// Maps our Language enum to what Piston expects
const PISTON_LANGUAGE_MAP: Record<
	Language,
	{ language: string; version: string }
> = {
	JAVASCRIPT: {
		language: "javascript",
		version: process.env.PISTON_VERSION_JAVASCRIPT ?? "20.11.1",
	},
	PYTHON: {
		language: "python",
		version: process.env.PISTON_VERSION_PYTHON ?? "3.12.0",
	},
	JAVA: {
		language: "java",
		version: process.env.PISTON_VERSION_JAVA ?? "15.0.2",
	},
	CSHARP: {
		language: "mono",
		version: process.env.PISTON_VERSION_CSHARP ?? "6.12.0",
	},
	CPP: {
		language: "c++",
		version: process.env.PISTON_VERSION_CPP ?? "10.2.0",
	},
};

export interface PistonResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

class PistonService {
	constructor(private readonly pistonUrl: string) {}

	async execute(
		language: Language,
		sourceCode: string,
	): Promise<PistonResult> {
		const { language: pistonLang, version } = PISTON_LANGUAGE_MAP[language];
		const response = await fetch(this.pistonUrl, {
			method: "POST",
			signal: AbortSignal.timeout(10_000),
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				language: pistonLang,
				version,
				files: [{ content: sourceCode }],
			}),
		});

		if (!response.ok) {
			throw new ExternalServiceError(
				`Piston request failed: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as {
			run: { stdout: string; stderr: string; code: number };
		};

		return {
			stdout: data.run.stdout,
			stderr: data.run.stderr,
			exitCode: data.run.code,
		};
	}
}

export default PistonService;
