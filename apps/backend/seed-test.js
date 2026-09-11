const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("--- Creating Facilities ---");
  const facA = await prisma.facility.upsert({
    where: { id: "facility-phc-andheri" },
    update: {},
    create: { id: "facility-phc-andheri", name: "PHC Andheri East", type: "PHC", location: "Andheri, Mumbai" }
  });
  const facB = await prisma.facility.upsert({
    where: { id: "facility-phc-borivali" },
    update: {},
    create: { id: "facility-phc-borivali", name: "PHC Borivali West", type: "PHC", location: "Borivali, Mumbai" }
  });
  console.log("Facility A:", facA.name, "|", facA.id);
  console.log("Facility B:", facB.name, "|", facB.id);

  console.log("--- Assigning Doctor to Facility A ---");
  const updated = await prisma.user.updateMany({
    where: { phoneNumber: "9876543210" },
    data: { facilityId: facA.id }
  });
  console.log("Doctor updated:", updated.count, "record(s)");

  console.log("--- Creating Patients ---");
  const p1 = await prisma.patientProfile.create({
    data: { firstName: "Ramesh", lastName: "Kumar", dateOfBirth: new Date("1985-03-15"), gender: "M", facilityId: facA.id }
  });
  const p2 = await prisma.patientProfile.create({
    data: { firstName: "Sunita", lastName: "Sharma", dateOfBirth: new Date("1990-07-22"), gender: "F", facilityId: facA.id }
  });
  const p3 = await prisma.patientProfile.create({
    data: { firstName: "Anil", lastName: "Patil", dateOfBirth: new Date("1978-11-05"), gender: "M", facilityId: facB.id }
  });
  const p4 = await prisma.patientProfile.create({
    data: { firstName: "Priya", lastName: "Desai", dateOfBirth: new Date("1995-01-30"), gender: "F", facilityId: facB.id }
  });
  console.log("Facility A patient:", p1.firstName, p1.lastName, "| ID:", p1.id);
  console.log("Facility A patient:", p2.firstName, p2.lastName, "| ID:", p2.id);
  console.log("Facility B patient:", p3.firstName, p3.lastName, "| ID:", p3.id);
  console.log("Facility B patient:", p4.firstName, p4.lastName, "| ID:", p4.id);
  console.log("--- DONE ---");
  console.log("Anil & Priya belong to PHC Borivali — Doctor should NOT see them!");
  await prisma.$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
