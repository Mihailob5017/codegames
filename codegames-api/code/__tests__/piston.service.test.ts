import { ExternalServiceError } from "../../shared/errors/app-error";
import PistonService from "../piston.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("PistonService", () => {
	let service: PistonService;

	beforeEach(() => {
		service = new PistonService("http://piston.test/api/v2/execute");
		mockFetch.mockReset();
	});

	describe("execute", () => {
		it("returns stdout, stderr, and exitCode on success", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					run: { stdout: "42\n", stderr: "", code: 0 },
				}),
			});

			const result = await service.execute(
				"JAVASCRIPT",
				"console.log(42)",
			);

			expect(result).toEqual({ stdout: "42\n", stderr: "", exitCode: 0 });
		});

		it("throws ExternalServiceError when response is not ok", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 503,
				statusText: "Service Unavailable",
			});

			await expect(
				service.execute("JAVASCRIPT", "console.log(42)"),
			).rejects.toBeInstanceOf(ExternalServiceError);
		});

		it("sends the correct language and version for JAVASCRIPT", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					run: { stdout: "", stderr: "", code: 0 },
				}),
			});

			await service.execute("JAVASCRIPT", "console.log(1)");

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.language).toBe("javascript");
			expect(body.version).toBeDefined();
			expect(body.files).toEqual([{ content: "console.log(1)" }]);
		});

		it("sends the correct language for PYTHON", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					run: { stdout: "", stderr: "", code: 0 },
				}),
			});

			await service.execute("PYTHON", "print(1)");

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.language).toBe("python");
		});
	});
});
