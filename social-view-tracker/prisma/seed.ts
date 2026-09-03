/*
 * Seed script (optional).
 *
 * In "Strict Unavailable only" mode no fabricated metric data is created.
 * Users, tracked content, and snapshots are created through the application
 * (registration + the metric worker), so this script deliberately seeds
 * nothing. It exists so `npm run prisma:seed` is a safe no-op.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "[seed] No demo data is created: metric values are only ever collected from official platform APIs.",
  );
  console.log("[seed] Create an account at /register to get started.");
}

main()
  .catch((err) => {
    console.error("[seed] failed", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());