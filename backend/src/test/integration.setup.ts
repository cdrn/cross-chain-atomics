import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.join(__dirname, "../../.env.test") });

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    // Reset the database using Prisma migrate
    execSync("NODE_ENV=test npx prisma migrate reset --force", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

beforeAll(async () => {
  // Reset database before all tests
  await resetDatabase();
});

afterAll(async () => {
  // Clean up database connections
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up all tables before each test
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log({ error });
      }
    }
  }
});
