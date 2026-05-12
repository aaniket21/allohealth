import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL (session mode, port 5432) for migrations
    // Fall back to DATABASE_URL if DIRECT_URL is not set
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
