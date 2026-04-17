import { useEffect, useState } from "react";
import "./App.css";
import Editor from "@monaco-editor/react";

interface Problem {
	id: string;
	number: number;
	title: string;
	description: string;
	difficulty: string;
}

// Maps API language keys to Monaco editor language IDs
const MONACO_LANGUAGE: Record<string, string> = {
	JAVASCRIPT: "javascript",
	PYTHON: "python",
	JAVA: "java",
	CPP: "cpp",
	CSHARP: "csharp",
};

function App() {
	const [languages, setLanguages] = useState<string[]>([]);
	const [language, setLanguage] = useState("JAVASCRIPT");
	const [code, setCode] = useState("// select a problem to start coding");
	const [problems, setProblems] = useState<Problem[]>([]);
	const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
	const [starterCodes, setStarterCodes] = useState<Record<
		string,
		string
	> | null>(null);

	const handleRun = () => {
		if (!selectedProblem) return;
		fetch("/api/v1/code/run", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				problemId: selectedProblem.id,
				language,
				code,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				const result = data.data;
				const stderr = result.stderr ? "\nStderr: " + result.stderr : "";
				alert("Run: " + result.passed + "/" + result.total + " passed" + stderr);
			})
			.catch((err) => {
				console.error("Error running code:", err);
				alert("Failed to run code");
			});
	};

	const handleSubmit = () => {
		if (!selectedProblem) return;
		fetch("/api/v1/code/execute", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				problemId: selectedProblem.id,
				language,
				code,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				const result = data.data;
				const status = result.allPassed ? "All tests passed!" : "Some tests failed";
				alert("Submit: " + status + " (" + result.passed + "/" + result.total + ")");
			})
			.catch((err) => {
				console.error("Error submitting code:", err);
				alert("Failed to submit code");
			});
	};

	useEffect(() => {
		const fetchProblems = async () => {
			const response = await fetch("/api/v1/admin_secret_route/problems");
			const data = await response.json();
			return data;
		};
		const fetchLanguages = async () => {
			const response = await fetch("/api/v1/code/get-languages");
			const data = await response.json();
			return data;
		};

		Promise.allSettled([fetchProblems(), fetchLanguages()]).then(
			([problemsResult, languagesResult]) => {
				if (problemsResult.status === "fulfilled") {
					setProblems(problemsResult.value.data);
				} else {
					console.error("Failed to fetch problems:", problemsResult.reason);
				}
				if (languagesResult.status === "fulfilled") {
					const langs: string[] = languagesResult.value.data;
					setLanguages(langs);
					if (langs.length > 0) {
						setLanguage(langs[0]);
					}
				} else {
					console.error("Failed to fetch languages:", languagesResult.reason);
				}
			},
		);
	}, []);

	useEffect(() => {
		if (!selectedProblem) return;

		let stale = false;
		const fetchStarterCode = async () => {
			const response = await fetch(
				`/api/v1/code/get-starter-code/${selectedProblem.id}`,
			);
			const data = await response.json();
			if (stale) return;

			const codes: Record<string, string> = {};
			for (const item of data.data) {
				codes[item.language] = item.code;
			}
			setStarterCodes(codes);
			setCode(codes[language] ?? "// no starter code for this language");
		};
		fetchStarterCode();

		return () => {
			stale = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedProblem]);

	const handleLanguageChange = (newLang: string) => {
		setLanguage(newLang);
		if (starterCodes) {
			setCode(starterCodes[newLang] ?? "// no starter code for this language");
		}
	};

	return (
		<>
			<h1>CodeGames</h1>

			<div>
				<div>
					<h2>Problems</h2>
					{problems.length > 0 ? (
						<ul style={{ listStyle: "none", padding: 0 }}>
							{problems.map((problem) => (
								<li key={problem.id} style={{ marginBottom: "0.5rem" }}>
									<button
										onClick={() => {
											setSelectedProblem(problem);
										}}
										style={{
											fontWeight:
												selectedProblem?.id === problem.id ? "bold" : "normal",
										}}
									>
										{problem.number}. {problem.title}
									</button>
								</li>
							))}
						</ul>
					) : (
						<p>Loading problems...</p>
					)}
				</div>

				<div style={{ width: 2000 }}>
					{selectedProblem && (
						<div style={{ marginBottom: "1rem" }}>
							<h2>{selectedProblem.title}</h2>
							<span>{selectedProblem.difficulty}</span>
							<p>{selectedProblem.description}</p>
						</div>
					)}
					{languages.length > 0 && (
						<select
							value={language}
							onChange={(e) => handleLanguageChange(e.target.value)}
							style={{ marginBottom: "0.5rem" }}
						>
							{languages.map((lang) => (
								<option key={lang} value={lang}>
									{lang}
								</option>
							))}
						</select>
					)}

					<Editor
						height="40vh"
						language={MONACO_LANGUAGE[language] ?? language.toLowerCase()}
						theme="vs-dark"
						value={code}
						onChange={(value) => setCode(value ?? "")}
					/>
				</div>
				<button onClick={handleRun}>Run</button>
				<button onClick={handleSubmit}>Submit</button>
			</div>
		</>
	);
}

export default App;
