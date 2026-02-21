import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient used by all repositories.
// The PrismaService in prisma-config.ts handles lifecycle (connect/disconnect).
const prisma = new PrismaClient();

export default prisma;
