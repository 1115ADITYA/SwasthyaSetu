const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();
prisma.facility.findMany({
  select: { id: true, name: true, type: true, location: true }
}).then(rows => {
  console.log("=== Facilities in DB ===");
  console.log(JSON.stringify(rows, null, 2));
  return prisma.$disconnect();
});
