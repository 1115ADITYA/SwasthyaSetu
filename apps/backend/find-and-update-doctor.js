const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  // List all doctors with facility info
  const doctors = await p.user.findMany({
    where: { role: 'DOCTOR' },
    select: { id: true, phoneNumber: true, facilityId: true, facility: { select: { name: true } } }
  });
  console.log('=== All DOCTOR accounts ===');
  console.log(JSON.stringify(doctors, null, 2));

  // Find the one with a facility
  const withFacility = doctors.find(d => d.facilityId !== null);
  if (!withFacility) {
    console.error('No DOCTOR with a facility found!');
    process.exit(1);
  }

  console.log('\n=== Updating password for:', withFacility.phoneNumber, '===');
  const hash = await bcrypt.hash('Doctor@123', 10);
  await p.user.update({
    where: { id: withFacility.id },
    data: { passwordHash: hash }
  });
  console.log('Password updated to Doctor@123');
  console.log('Doctor Login ID:', withFacility.phoneNumber);
  console.log('Doctor Facility:', withFacility.facility ? withFacility.facility.name : 'none');
  console.log('Doctor Facility ID:', withFacility.facilityId);

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
