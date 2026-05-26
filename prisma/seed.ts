import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaults = [
    { key: "total_goal_kopecks", value: "100000000000" }, // 1 000 000 000 грн
    { key: "total_area_m2",      value: "21833000000" },  // 21 833 км² Львівщини
    { key: "collected_kopecks",  value: "0" },
  ];

  for (const s of defaults) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("Settings seeded.");
}

main().finally(() => pool.end());
