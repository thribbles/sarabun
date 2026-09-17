const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Roles
  const roles = [
    { id: 1, name: "ADMIN" },
    { id: 2, name: "AUTHOR" },
    { id: 3, name: "REVIEWER" },
    { id: 4, name: "VIEWER" },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { name: r.name },
      create: r,
    });
  }

  // 2. Document Types
  const docTypes = [
    { id: 1, code: "memo", name: "หนังสือภายใน" },
    { id: 2, code: "external", name: "หนังสือภายนอก" },
  ];
  for (const dt of docTypes) {
    await prisma.documentType.upsert({
      where: { id: dt.id },
      update: { name: dt.name, code: dt.code },
      create: dt,
    });
  }

  // 3. Departments
  const depts = [
    { id: "dept-pao", name: "องค์การบริหารส่วนจังหวัดปราจีนบุรี" },
    { id: "dept-plan", name: "กองยุทธศาสตร์และงบประมาณ" },
    { id: "dept-admin", name: "สำนักปลัดองค์การบริหารส่วนจังหวัด" },
  ];
  for (const d of depts) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: { name: d.name },
      create: d,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
