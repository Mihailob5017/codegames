import Test from "supertest/lib/test";
import { Problem, TestCase } from "../../generated/prisma";

interface ICodeRepository {
	getProblem(id: string): Promise<Problem | null>;
	getTestcase(id: string): Promise<TestCase[] | null>;
	submitCode(code: string, problemId: string): Promise<any>;
}

export class CodeRepository implements ICodeRepository {
	getProblem(id: string): Promise<Problem | null> {
		throw new Error("Method not implemented.");
	}

	getTestcase(id: string): Promise<TestCase[] | null> {
		throw new Error("Method not implemented.");
	}

	submitCode(code: string, problemId: string): Promise<any> {
		throw new Error("Method not implemented.");
	}
}
