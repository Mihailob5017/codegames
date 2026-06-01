import { Language } from "@prisma/client";
import { ExternalServiceError } from "../shared/errors/app-error";
import { getAppConfig } from "../infrastructure/app-config";
import type { EnvConfig } from "../infrastructure/env-config";

// Our Language enum -> the runtime identifier Piston expects, plus the
// config key holding the pinned version. Versions are resolved from the
// validated app config at call time (never read from process.env directly).
const PISTON_RUNTIMES: Record<
	Language,
	{ language: string; versionKey: keyof EnvConfig }
> = {
	JAVASCRIPT: {
		language: "javascript",
		versionKey: "PISTON_VERSION_JAVASCRIPT",
	},
	PYTHON: { language: "python", versionKey: "PISTON_VERSION_PYTHON" },
	JAVA: { language: "java", versionKey: "PISTON_VERSION_JAVA" },
	CSHARP: { language: "mono", versionKey: "PISTON_VERSION_CSHARP" },
	CPP: { language: "c++", versionKey: "PISTON_VERSION_CPP" },
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
		const { language: pistonLang, versionKey } = PISTON_RUNTIMES[language];
		const version = getAppConfig()[versionKey] as string;
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
