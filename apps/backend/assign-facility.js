const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

// The test ASHA account (phone 9999999999, id: 65627236-16b6-44dd-910d-19ca56dbdc80)
// Assign facility: phc-pune-01 (Primary Health Centre - Pune Rural)
const ASHA_PHONE = "9999999999";
const FACILITY_ID = "phc-pune-01";

async function main() {
  // Confirm the user exists and is ASHA with null facilityId
  const user = await prisma.user.findUnique({
    where: { phoneNumber: ASHA_PHONE },
    select: { id: true, phoneNumber: true, role: true, facilityId: true }
  });

  if (!user) {
    console.error("ERROR: User not found for phone", ASHA_PHONE);
    return;
  }
  if (user.role !== "ASHA") {
    console.error("ERROR: User is not an ASHA, role is:", user.role);
    return;
  }
  if (user.facilityId !== null) {
    console.log("User already has facilityId:", user.facilityId, "- no update needed.");
    return;
  }

  console.log("Before update:", user);

  // Confirm facility exists
  const facility = await prisma.facility.findUnique({
    where: { id: FACILITY_ID },
    select: { id: true, name: true }
  });
  if (!facility) {
    console.error("ERROR: Facility not found:", FACILITY_ID);
    return;
  }
  console.log("Target facility:", facility);

  // Apply the update
  const updated = await prisma.user.update({
    where: { phoneNumber: ASHA_PHONE },
    data: { facilityId: FACILITY_ID },
    select: { id: true, phoneNumber: true, role: true, facilityId: true }
  });

  console.log("After update:", updated);
  console.log("\n✅ Successfully assigned facility to ASHA.");
}

main().finally(() => prisma.$disconnect());
