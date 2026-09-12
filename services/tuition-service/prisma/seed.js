const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.tuitionFee.createMany({
    data: [
      { mssv: "52100001", studentName: "Le Van Bao", amount: 12500000, semester: "HK1-2026-2027" },
      { mssv: "52100002", studentName: "Pham Thi Hoa", amount: 9800000, semester: "HK1-2026-2027" },
    ],
    skipDuplicates: true,
  });
  console.log("Seeded tuition fees.");
}

main().finally(() => prisma.$disconnect());
