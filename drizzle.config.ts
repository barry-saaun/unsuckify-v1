import { config } from "dotenv";
import { type Config } from "drizzle-kit";

// Load environment variables
config();

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
