// Dữ liệu mẫu để test — chạy: node prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);
  await prisma.user.createMany({
    data: [
      { username: "khoa", passwordHash, fullName: "Nguyen Van Khoa", phone: "0900000001", email: "khoa@example.com", balance: 5000000 },
      { username: "an", passwordHash, fullName: "Tran Thi An", phone: "0900000002", email: "an@example.com", balance: 2000000 },
    ],
    skipDuplicates: true,
  });
  console.log("Seeded users. Password mặc định cho cả 2: 123456");
}

main().finally(() => prisma.$disconnect());
