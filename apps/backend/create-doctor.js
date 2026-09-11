const { PrismaClient } = require("../../node_modules/@prisma/client");
const bcrypt = require("../../node_modules/bcryptjs");
const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash("doctor123", 10);
  const existing = await prisma.user.findUnique({ where: { phoneNumber: "9999100001" } });
  if (existing) {
    await prisma.user.update({
      where: { phoneNumber: "9999100001" },
      data: { role: "DOCTOR", facilityId: "facility-phc-andheri", passwordHash: hash }
    });
    console.log("Doctor account UPDATED");
  } else {
    await prisma.user.create({
      data: { phoneNumber: "9999100001", passwordHash: hash, role: "DOCTOR", facilityId: "facility-phc-andheri" }
    });
    console.log("Doctor account CREATED");
  }
  console.log("");
  console.log("=== ACCOUNTS READY ===");
  console.log("DOCTOR  -> Phone: 9999100001  | Password: doctor123   | Facility: PHC Andheri East");
  console.log("ADMIN   -> Phone: 9876543210   | Password: password123 | Sees: ALL district");
  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
