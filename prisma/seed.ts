import { config } from "dotenv";
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import DEFAULT_EXERCISES from "./data/exercises.json";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding default exercises…");

  // Never delete — cascade would wipe WorkoutExercise + Set rows.
  // Instead: insert new exercises and update changed fields on existing ones.
  const existing = await prisma.exercise.findMany({
    where: { user_id: null },
    select: { id: true, name: true },
  });
  const existingByName = new Map(existing.map((e) => [e.name, e.id]));

  const toInsert = DEFAULT_EXERCISES.filter((e) => !existingByName.has(e.name));
  const toUpdate = DEFAULT_EXERCISES.filter((e) => existingByName.has(e.name));

  if (toInsert.length > 0) {
    await prisma.exercise.createMany({
      data: toInsert.map((e) => ({
        name: e.name,
        muscle_groups: e.muscle_groups,
        equipment: e.equipment,
        user_id: null,
      })),
    });
  }

  for (const e of toUpdate) {
    await prisma.exercise.update({
      where: { id: existingByName.get(e.name)! },
      data: { muscle_groups: e.muscle_groups, equipment: e.equipment },
    });
  }

  console.log(`Done — ${toInsert.length} inserted, ${toUpdate.length} updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());