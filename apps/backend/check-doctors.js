const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { role: 'DOCTOR' },
  select: { id: true, phoneNumber: true, role: true, facilityId: true }
}).then(users => {
  console.log("=== DOCTOR Users ===");
  console.log(JSON.stringify(users, null, 2));
  return prisma.$disconnect();
});
