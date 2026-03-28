import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  adapter?: PrismaNeon;
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.adapter = adapter;
  globalForPrisma.prisma = prisma;
}
