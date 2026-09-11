const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();
prisma.user.update({
  where: { phoneNumber: "9999100001" },
  data: { facilityId: "facility-phc-andheri" }
}).then(u => {
  console.log("Done! Doctor linked to:", u.facilityId);
  console.log("Role:", u.role);
  return prisma.$disconnect();
});
