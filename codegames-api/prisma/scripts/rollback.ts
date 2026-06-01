import "dotenv/config";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── How Prisma rollback works ────────────────────────────────────────────────
//
// Prisma Migrate is "forward-only" — there are no automatic down migrations.
// This script does two things:
//
// 1. Finds the last successfully applied migration in _prisma_migrations.
// 2. Marks it as rolled-back in Prisma's tracking table so `migrate dev` will
//    attempt to re-apply it on the next run.
//
// IMPORTANT: This does NOT reverse the SQL changes in your database.
// To actually undo a schema change you must:
//   a) Write the reverse SQL (e.g. DROP COLUMN, DROP TABLE, ALTER TYPE …).
//   b) Run it via `prisma db execute --file ./prisma/scripts/down.sql`.
//   c) Then run this script to clear the migration from Prisma's tracking.
//   d) Or create a new forward migration that applies the reverse change.
//
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
	type MigrationRow = { migration_name: string; finished_at: Date | null };

	const rows = await prisma.$queryRaw<MigrationRow[]>`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
          AND rolled_back_at IS NULL
        ORDER BY finished_at DESC
        LIMIT 1
    `;

	if (!rows.length) {
		console.log("No applied migrations found — nothing to roll back.");
		return;
	}

	const { migration_name } = rows[0];

	console.log(`Last applied migration: ${migration_name}`);
	console.log(`Marking as rolled back…\n`);

	execSync(`prisma migrate resolve --rolled-back "${migration_name}"`, {
		stdio: "inherit",
		cwd: process.cwd(),
	});

	console.log(`\n✔  "${migration_name}" is now marked as rolled back.`);
	console.log(`\nNext steps:`);
	console.log(`  • If you want to re-apply it:    npm run migrate:dev`);
	console.log(
		`  • If you want to undo the schema change, write the reverse SQL first,`,
	);
	console.log(
		`    run it with: npx prisma db execute --file ./prisma/scripts/down.sql`,
	);
	console.log(
		`    then run this script again, or create a new forward migration.`,
	);
}

main()
	.catch((e) => {
		console.error("Rollback script failed:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
