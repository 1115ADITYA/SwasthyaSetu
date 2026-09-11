const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { role: 'ASHA' },
  select: { id: true, phoneNumber: true, role: true, facilityId: true }
}).then(users => {
  console.log("=== ASHA Users in DB ===");
  console.log(JSON.stringify(users, null, 2));
  return prisma.$disconnect();
});
