import { PrismaClient } from "@prisma/client";

// Fix: NextResponse.json uses JSON.stringify which throws "Do not know how to serialize a BigInt"
// for Wallet.initialBalance / Transaction.amount / Budget.amount / Goal.targetAmount.
// Patch once so any missed spot still serializes as string instead of 500.
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
