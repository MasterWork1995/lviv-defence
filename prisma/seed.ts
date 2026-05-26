import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Run to reset DB to clean state (e.g. before production launch)
async function main() {
  await prisma.donation.deleteMany();
  await prisma.expense.deleteMany();

  await prisma.setting.upsert({ where: { key: "total_goal_uah" },            update: { value: "1000000000" },       create: { key: "total_goal_uah",            value: "1000000000"       } });
  await prisma.setting.upsert({ where: { key: "total_area_m2" },             update: { value: "21833000000" },      create: { key: "total_area_m2",             value: "21833000000"      } });
  await prisma.setting.upsert({ where: { key: "collected_uah" },             update: { value: "0" },                create: { key: "collected_uah",             value: "0"                } });
  await prisma.setting.upsert({ where: { key: "donate_preset_amounts_uah" }, update: { value: "[100,500,1000,5000]" }, create: { key: "donate_preset_amounts_uah", value: "[100,500,1000,5000]" } });

  console.log("✓ DB reset to clean state.");
}

main().finally(() => pool.end());
