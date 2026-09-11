const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();
prisma.user.findUnique({
  where: { phoneNumber: "9876543210" },
  select: { phoneNumber: true, role: true, facilityId: true }
}).then(u => {
  console.log("=== User in DB ===");
  console.log(u);
  return prisma.$disconnect();
});
