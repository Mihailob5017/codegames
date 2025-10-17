import { HttpError } from "../../types/common/error-types";
import { CodeSubmission } from "../../types/dto/code-execution-types";

export interface SecurityPattern {
	pattern: RegExp;
	description: string;
	category: "injection" | "dos" | "malicious" | "resource";
}

export class CodeSecurityValidator {
	private static readonly dangerousPatterns: Record<string, SecurityPattern[]> =
		{
			javascript: [
				{
					pattern: /require\s*\(\s*['"`]fs['"`]\s*\)/i,
					description: "File system access",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]child_process['"`]\s*\)/i,
					description: "Child process execution",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]os['"`]\s*\)/i,
					description: "Operating system access",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]path['"`]\s*\)/i,
					description: "Path manipulation",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]net['"`]\s*\)/i,
					description: "Network access",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]http['"`]\s*\)/i,
					description: "HTTP module access",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]https['"`]\s*\)/i,
					description: "HTTPS module access",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]cluster['"`]\s*\)/i,
					description: "Cluster module access",
					category: "injection",
				},
				{
					pattern: /require\s*\(\s*['"`]worker_threads['"`]\s*\)/i,
					description: "Worker threads access",
					category: "injection",
				},
				{
					pattern: /eval\s*\(/i,
					description: "Dynamic code execution",
					category: "injection",
				},
				{
					pattern: /Function\s*\(/i,
					description: "Function constructor",
					category: "injection",
				},
				{
					pattern: /setTimeout\s*\(/i,
					description: "Timer function",
					category: "dos",
				},
				{
					pattern: /setInterval\s*\(/i,
					description: "Interval function",
					category: "dos",
				},
				{
					pattern: /process\s*\./i,
					description: "Process object access",
					category: "injection",
				},
				{
					pattern: /global\s*\./i,
					description: "Global object access",
					category: "injection",
				},
				{
					pattern: /__dirname/i,
					description: "Directory name access",
					category: "injection",
				},
				{
					pattern: /__filename/i,
					description: "Filename access",
					category: "injection",
				},
				{
					pattern: /\.exec\s*\(/i,
					description: "Command execution",
					category: "injection",
				},
				{
					pattern: /\.spawn\s*\(/i,
					description: "Process spawning",
					category: "injection",
				},
				{
					pattern: /\.fork\s*\(/i,
					description: "Process forking",
					category: "injection",
				},
			],
			python: [
				{
					pattern: /import\s+os/i,
					description: "Operating system module",
					category: "injection",
				},
				{
					pattern: /import\s+sys/i,
					description: "System module",
					category: "injection",
				},
				{
					pattern: /import\s+subprocess/i,
					description: "Subprocess module",
					category: "injection",
				},
				{
					pattern: /import\s+socket/i,
					description: "Socket module",
					category: "injection",
				},
				{
					pattern: /import\s+urllib/i,
					description: "URL library",
					category: "injection",
				},
				{
					pattern: /import\s+requests/i,
					description: "HTTP requests library",
					category: "injection",
				},
				{
					pattern: /import\s+threading/i,
					description: "Threading module",
					category: "dos",
				},
				{
					pattern: /import\s+multiprocessing/i,
					description: "Multiprocessing module",
					category: "dos",
				},
				{
					pattern: /import\s+asyncio/i,
					description: "Async I/O module",
					category: "dos",
				},
				{
					pattern: /from\s+os\s+import/i,
					description: "Operating system import",
					category: "injection",
				},
				{
					pattern: /from\s+sys\s+import/i,
					description: "System import",
					category: "injection",
				},
				{
					pattern: /from\s+subprocess\s+import/i,
					description: "Subprocess import",
					category: "injection",
				},
				{
					pattern: /from\s+socket\s+import/i,
					description: "Socket import",
					category: "injection",
				},
				{
					pattern: /from\s+urllib\s+import/i,
					description: "URL library import",
					category: "injection",
				},
				{
					pattern: /from\s+requests\s+import/i,
					description: "HTTP requests import",
					category: "injection",
				},
				{
					pattern: /from\s+threading\s+import/i,
					description: "Threading import",
					category: "dos",
				},
				{
					pattern: /from\s+multiprocessing\s+import/i,
					description: "Multiprocessing import",
					category: "dos",
				},
				{
					pattern: /from\s+asyncio\s+import/i,
					description: "Async I/O import",
					category: "dos",
				},
				{
					pattern: /exec\s*\(/i,
					description: "Dynamic code execution",
					category: "injection",
				},
				{
					pattern: /eval\s*\(/i,
					description: "Expression evaluation",
					category: "injection",
				},
				{
					pattern: /compile\s*\(/i,
					description: "Code compilation",
					category: "injection",
				},
				{
					pattern: /open\s*\(/i,
					description: "File opening",
					category: "injection",
				},
				{
					pattern: /file\s*\(/i,
					description: "File access",
					category: "injection",
				},
				{
					pattern: /input\s*\(/i,
					description: "User input",
					category: "injection",
				},
				{
					pattern: /raw_input\s*\(/i,
					description: "Raw user input",
					category: "injection",
				},
				{
					pattern: /__import__\s*\(/i,
					description: "Dynamic import",
					category: "injection",
				},
				{
					pattern: /globals\s*\(/i,
					description: "Global variables access",
					category: "injection",
				},
				{
					pattern: /locals\s*\(/i,
					description: "Local variables access",
					category: "injection",
				},
				{
					pattern: /vars\s*\(/i,
					description: "Variable inspection",
					category: "injection",
				},
				{
					pattern: /dir\s*\(/i,
					description: "Directory listing",
					category: "injection",
				},
			],
		};

	private static readonly dosPatterns: SecurityPattern[] = [
		{
			pattern: /while\s*\(\s*true\s*\)/i,
			description: "Infinite while loop",
			category: "dos",
		},
		{
			pattern: /while\s+True\s*:/i,
			description: "Infinite while loop (Python)",
			category: "dos",
		},
		{
			pattern: /while\s+1\s*:/i,
			description: "Infinite while loop variant",
			category: "dos",
		},
		{
			pattern: /for\s*\(\s*;\s*;\s*\)/i,
			description: "Infinite for loop",
			category: "dos",
		},
		{
			pattern: /for\s+.*\s+in\s+range\s*\(\s*\d{6,}\s*\)/i,
			description: "Large range iteration",
			category: "dos",
		},
		{
			pattern: /range\s*\(\s*\d{6,}\s*\)/i,
			description: "Large range creation",
			category: "dos",
		},
		{
			pattern: /setTimeout\s*\(\s*.*,\s*0\s*\)/i,
			description: "Rapid timeout execution",
			category: "dos",
		},
		{
			pattern: /setInterval\s*\(\s*.*,\s*[0-9]\s*\)/i,
			description: "Rapid interval execution",
			category: "dos",
		},
	];

	private static readonly maliciousKeywords: SecurityPattern[] = [
		{
			pattern: /password/i,
			description: "Password reference",
			category: "malicious",
		},
		{
			pattern: /secret/i,
			description: "Secret reference",
			category: "malicious",
		},
		{
			pattern: /token/i,
			description: "Token reference",
			category: "malicious",
		},
		{
			pattern: /api[_-]?key/i,
			description: "API key reference",
			category: "malicious",
		},
		{
			pattern: /private[_-]?key/i,
			description: "Private key reference",
			category: "malicious",
		},
		{
			pattern: /\.env/i,
			description: "Environment file access",
			category: "malicious",
		},
		{
			pattern: /config/i,
			description: "Configuration access",
			category: "malicious",
		},
		{
			pattern: /database/i,
			description: "Database reference",
			category: "malicious",
		},
		{
			pattern: /db[_-]?pass/i,
			description: "Database password",
			category: "malicious",
		},
		{
			pattern: /admin/i,
			description: "Admin reference",
			category: "malicious",
		},
		{
			pattern: /root/i,
			description: "Root user reference",
			category: "malicious",
		},
		{
			pattern: /sudo/i,
			description: "Sudo command",
			category: "malicious",
		},
		{
			pattern: /chmod/i,
			description: "File permission change",
			category: "malicious",
		},
		{
			pattern: /chown/i,
			description: "File ownership change",
			category: "malicious",
		},
		{
			pattern: /rm\s+-rf/i,
			description: "Recursive file deletion",
			category: "malicious",
		},
		{
			pattern: /\.ssh/i,
			description: "SSH directory access",
			category: "malicious",
		},
		{
			pattern: /etc\/passwd/i,
			description: "Password file access",
			category: "malicious",
		},
		{
			pattern: /\/proc\//i,
			description: "Process filesystem access",
			category: "malicious",
		},
		{
			pattern: /\/sys\//i,
			description: "System filesystem access",
			category: "malicious",
		},
	];

	private static readonly resourceLimits = {
		maxLines: 100,
		maxCharacters: 5000,
		maxNestedLoops: 2,
	};

	public static validateCodeSecurity(submission: CodeSubmission): void {
		const sourceCode = submission.source_code;
		const language = submission.language;

		// Check language-specific dangerous patterns
		this.checkLanguagePatterns(sourceCode, language);

		// Check DoS patterns
		this.checkDosPatterns(sourceCode);

		// Check malicious keywords
		this.checkMaliciousKeywords(sourceCode);

		// Check resource limits
		this.checkResourceLimits(sourceCode);

		// Check nested loops
		this.checkNestedLoops(sourceCode, language);
	}

	private static checkLanguagePatterns(
		sourceCode: string,
		language: string
	): void {
		const patterns = this.dangerousPatterns[language] || [];

		for (const { pattern, description, category } of patterns) {
			if (pattern.test(sourceCode)) {
				throw new HttpError(
					400,
					`Security violation: ${description} (${category})`
				);
			}
		}
	}

	private static checkDosPatterns(sourceCode: string): void {
		for (const { pattern, description } of this.dosPatterns) {
			if (pattern.test(sourceCode)) {
				throw new HttpError(400, `DoS attack pattern detected: ${description}`);
			}
		}
	}

	private static checkMaliciousKeywords(sourceCode: string): void {
		for (const { pattern, description } of this.maliciousKeywords) {
			if (pattern.test(sourceCode)) {
				throw new HttpError(400, `Suspicious keyword detected: ${description}`);
			}
		}
	}

	private static checkResourceLimits(sourceCode: string): void {
		const lineCount = sourceCode.split("\n").length;
		if (lineCount > this.resourceLimits.maxLines) {
			throw new HttpError(
				400,
				`Code exceeds maximum line limit (${this.resourceLimits.maxLines} lines)`
			);
		}

		if (sourceCode.length > this.resourceLimits.maxCharacters) {
			throw new HttpError(
				400,
				`Code exceeds maximum character limit (${this.resourceLimits.maxCharacters} characters)`
			);
		}
	}

	private static checkNestedLoops(sourceCode: string, language: string): void {
		const jsNestedLoopPattern =
			/for\s*\([^}]*\)\s*\{[^}]*for\s*\([^}]*\)\s*\{[^}]*for\s*\(/i;
		const pythonNestedLoopPattern =
			/for\s+.*:\s*[\s\S]*?for\s+.*:\s*[\s\S]*?for\s+.*:/i;

		const isJavaScript = language === "javascript";
		const isPython = language === "python";

		if (
			(isJavaScript && jsNestedLoopPattern.test(sourceCode)) ||
			(isPython && pythonNestedLoopPattern.test(sourceCode))
		) {
			throw new HttpError(
				400,
				`Deeply nested loops detected (max ${this.resourceLimits.maxNestedLoops} levels allowed)`
			);
		}
	}

	public static getSecurityPatterns(): Record<string, SecurityPattern[]> {
		return this.dangerousPatterns;
	}

	public static getDosPatterns(): SecurityPattern[] {
		return this.dosPatterns;
	}

	public static getMaliciousKeywords(): SecurityPattern[] {
		return this.maliciousKeywords;
	}

	public static getResourceLimits() {
		return this.resourceLimits;
	}
}
