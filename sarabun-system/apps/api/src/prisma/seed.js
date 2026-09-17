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

  // 4. Demo Users
  const users = [
    {
      id: "mem-nayok",
      username: "nayok",
      passwordHash: "123",
      fullName: "ฮนมะ ยูจิโจ",
      position: "นายกองค์การบริหารส่วนจังหวัดปราจีนบุรี",
      departmentId: "dept-pao",
      roleId: 1,
    },
    {
      id: "mem-edu",
      username: "edu",
      passwordHash: "123",
      fullName: "เอดาจิม่า เฮฮาจิ",
      position: "ผู้อำนวยการกองการศึกษา ศาสนา และวัฒนธรรม",
      departmentId: "dept-pao",
      roleId: 2,
    },
    {
      id: "mem-yotta",
      username: "yotta",
      passwordHash: "123",
      fullName: "มาสค์ไรเดอร์ ดีเคด",
      position: "ผู้อำนวยการกองยุทธศาสตร์และงบประมาณ",
      departmentId: "dept-plan",
      roleId: 2,
    },
    {
      id: "mem-admin",
      username: "admin",
      passwordHash: "123",
      fullName: "นาย คิระ ยามาโตะ",
      position: "หัวหน้าสำนักปลัด อบจ.ปราจีนบุรี",
      departmentId: "dept-admin",
      roleId: 1,
    },
    {
      id: "mem-pasadu",
      username: "pasadu",
      passwordHash: "123",
      fullName: "นางสาว โจเซพ โจสตา",
      position: "ผู้อำนวยการกองพัสดุและทรัพย์สิน",
      departmentId: "dept-pao",
      roleId: 2,
    },
    {
      id: "mem-chang",
      username: "chang",
      passwordHash: "123",
      fullName: "นาย เอโดงาว่า โคนัน",
      position: "ผู้อำนวยการกองช่าง",
      departmentId: "dept-pao",
      roleId: 2,
    },
    {
      id: "mem-klang",
      username: "klang",
      passwordHash: "123",
      fullName: "นางสาว เฟริน จุบจุบ",
      position: "ผู้อำนวยการกองคลัง",
      departmentId: "dept-pao",
      roleId: 2,
    },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        id: u.id,
        fullName: u.fullName,
        position: u.position,
        departmentId: u.departmentId,
        roleId: u.roleId,
      },
      create: u,
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
