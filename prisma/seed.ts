import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Kategori sistem (isSystem = true, userId = null) — muncul untuk semua user
  const systemCategories = [
    { name: "Gaji", icon: "briefcase", color: "#10B981", type: "INCOME" as const },
    { name: "Freelance", icon: "laptop", color: "#06B6D4", type: "INCOME" as const },
    { name: "Investasi", icon: "trending-up", color: "#8B5CF6", type: "INCOME" as const },
    { name: "Lainnya", icon: "plus", color: "#94A3B8", type: "INCOME" as const },
    { name: "Makan", icon: "utensils", color: "#F59E0B", type: "EXPENSE" as const },
    { name: "Transport", icon: "car", color: "#3B82F6", type: "EXPENSE" as const },
    { name: "Belanja", icon: "shopping-bag", color: "#EC4899", type: "EXPENSE" as const },
    { name: "Tagihan", icon: "receipt", color: "#EF4444", type: "EXPENSE" as const },
    { name: "Hiburan", icon: "film", color: "#8B5CF6", type: "EXPENSE" as const },
    { name: "Kesehatan", icon: "heart", color: "#14B8A6", type: "EXPENSE" as const },
    { name: "Pendidikan", icon: "graduation-cap", color: "#0EA5E9", type: "EXPENSE" as const },
    { name: "Lainnya", icon: "more-horizontal", color: "#94A3B8", type: "EXPENSE" as const },
  ];

  for (const c of systemCategories) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: null as any, name: c.name, type: c.type as any } } as any,
      update: {},
      create: { name: c.name, icon: c.icon, color: c.color, type: c.type as any, isSystem: true, userId: null },
    }).catch(async () => {
      // fallback jika @@unique belum include null handling
      const exists = await prisma.category.findFirst({ where: { name: c.name, type: c.type as any, isSystem: true } });
      if (!exists) await prisma.category.create({ data: { name: c.name, icon: c.icon, color: c.color, type: c.type as any, isSystem: true } });
    });
  }

  console.log("Seed selesai: kategori sistem terisi.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
