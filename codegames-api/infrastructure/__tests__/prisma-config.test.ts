jest.mock("../prisma", () => ({
	__esModule: true,
	default: {
		$connect: jest.fn(),
		$disconnect: jest.fn(),
		$queryRaw: jest.fn(),
	},
}));
jest.mock("../logger", () => ({
	__esModule: true,
	default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import prisma from "../prisma";
import PrismaService from "../prisma-config";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("PrismaService", () => {
	let service: PrismaService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new PrismaService();
	});

	describe("connect", () => {
		it("calls $connect on the shared prisma singleton", async () => {
			(mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
			await service.connect();
			expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
		});

		it("propagates errors from $connect so startServer can fail fast", async () => {
			const dbError = new Error("Connection refused");
			(mockPrisma.$connect as jest.Mock).mockRejectedValue(dbError);
			await expect(service.connect()).rejects.toThrow("Connection refused");
		});

		it("does not call $connect a second time if already connected", async () => {
			(mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
			await service.connect();
			await service.connect();
			expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
		});
	});

	describe("disconnect", () => {
		it("calls $disconnect on the shared prisma singleton", async () => {
			(mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
			(mockPrisma.$disconnect as jest.Mock).mockResolvedValue(undefined);
			await service.connect();
			await service.disconnect();
			expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
		});

		it("does not call $disconnect if not connected", async () => {
			(mockPrisma.$disconnect as jest.Mock).mockResolvedValue(undefined);
			await service.disconnect();
			expect(mockPrisma.$disconnect).not.toHaveBeenCalled();
		});
	});

	describe("healthCheck", () => {
		it("returns true when query succeeds", async () => {
			(mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ "?column?": 1 }]);
			const result = await service.healthCheck();
			expect(result).toBe(true);
		});

		it("returns false and logs error when query fails", async () => {
			const logger = (await import("../logger")).default;
			(mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("DB down"));
			const result = await service.healthCheck();
			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				"Database health check failed",
				expect.objectContaining({ error: "DB down" }),
			);
		});
	});
});
