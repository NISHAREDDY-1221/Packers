import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: any | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV !== "production" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
