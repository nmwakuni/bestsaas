import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo school
  const school = await prisma.school.upsert({
    where: { code: "DEMO001" },
    update: {},
    create: {
      code: "DEMO001",
      name: "Demo Primary School",
      email: "admin@demoschool.co.ke",
      phone: "254712345678",
      address: "Nairobi, Kenya",
      mpesaShortcode: "174379", // Sandbox shortcode
      subscriptionPlan: "GROWTH",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log("✅ Created school:", school.name);

  // Create academic year
  const academicYear = await prisma.academicYear.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "2024",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "2024",
      startDate: new Date("2024-01-08"),
      endDate: new Date("2024-12-15"),
      currentTerm: 3,
      isActive: true,
    },
  });

  console.log("✅ Created academic year:", academicYear.name);

  // Create terms
  await prisma.term.createMany({
    data: [
      {
        academicYearId: academicYear.id,
        termNumber: 1,
        startDate: new Date("2024-01-08"),
        endDate: new Date("2024-04-12"),
      },
      {
        academicYearId: academicYear.id,
        termNumber: 2,
        startDate: new Date("2024-05-06"),
        endDate: new Date("2024-08-09"),
      },
      {
        academicYearId: academicYear.id,
        termNumber: 3,
        startDate: new Date("2024-09-02"),
        endDate: new Date("2024-12-15"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Created terms");

  // Create classes
  const classes = await Promise.all([
    prisma.class.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: "Grade 1A",
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: "Grade 1A",
        grade: "Grade 1",
        stream: "A",
        capacity: 40,
      },
    }),
    prisma.class.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: "Grade 2A",
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: "Grade 2A",
        grade: "Grade 2",
        stream: "A",
        capacity: 40,
      },
    }),
  ]);

  console.log("✅ Created classes");

  // Create fee structure for Grade 1
  const feeStructure = await prisma.feeStructure.upsert({
    where: {
      schoolId_grade_academicYear: {
        schoolId: school.id,
        grade: "Grade 1",
        academicYear: "2024",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "Grade 1 Fees 2024",
      grade: "Grade 1",
      academicYear: "2024",
      isActive: true,
      feeItems: {
        create: [
          {
            name: "Tuition",
            amount: 15000,
            term: 0, // Annual
            isOptional: false,
          },
          {
            name: "Transport",
            amount: 3000,
            term: 0,
            isOptional: true,
          },
          {
            name: "Meals",
            amount: 5000,
            term: 0,
            isOptional: false,
          },
          {
            name: "Activities",
            amount: 2000,
            term: 0,
            isOptional: true,
          },
        ],
      },
    },
    include: {
      feeItems: true,
    },
  });

  console.log("✅ Created fee structure");

  // Create sample parents
  const parent1 = await prisma.parent.create({
    data: {
      firstName: "John",
      lastName: "Kamau",
      relationship: "FATHER",
      phone: "254712345678",
      email: "john.kamau@example.com",
      nationalId: "12345678",
      occupation: "Engineer",
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      firstName: "Jane",
      lastName: "Wanjiru",
      relationship: "MOTHER",
      phone: "254723456789",
      email: "jane.wanjiru@example.com",
      nationalId: "23456789",
      occupation: "Teacher",
    },
  });

  console.log("✅ Created sample parents");

  // Create sample students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        schoolId: school.id,
        classId: classes[0].id,
        admissionNumber: "DEMO001/2024/0001",
        firstName: "Peter",
        middleName: "Mwangi",
        lastName: "Kamau",
        dateOfBirth: new Date("2017-03-15"),
        gender: "MALE",
        enrollmentDate: new Date("2024-01-08"),
        status: "ACTIVE",
        parents: {
          connect: [{ id: parent1.id }],
        },
      },
    }),
    prisma.student.create({
      data: {
        schoolId: school.id,
        classId: classes[0].id,
        admissionNumber: "DEMO001/2024/0002",
        firstName: "Mary",
        middleName: "Akinyi",
        lastName: "Wanjiru",
        dateOfBirth: new Date("2017-08-22"),
        gender: "FEMALE",
        enrollmentDate: new Date("2024-01-08"),
        status: "ACTIVE",
        parents: {
          connect: [{ id: parent2.id }],
        },
      },
    }),
  ]);

  console.log("✅ Created sample students");

  // Create fee records for students
  for (const student of students) {
    const totalAmount = feeStructure.feeItems
      .filter((item: any) => !item.isOptional)
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    await prisma.feeRecord.create({
      data: {
        studentId: student.id,
        academicYear: "2024",
        term: 3,
        totalAmount: totalAmount,
        paidAmount: 0,
        balance: totalAmount,
        status: "PENDING",
      },
    });
  }

  console.log("✅ Created fee records");

  // Create a sample payment
  const payment = await prisma.payment.create({
    data: {
      schoolId: school.id,
      studentId: students[0].id,
      amount: 5000,
      paymentMethod: "MPESA",
      mpesaReceiptNumber: "QGK12345678",
      mpesaPhone: "254712345678",
      receiptNumber: `REC-${Date.now()}-001`,
      paidBy: "John Kamau",
      status: "COMPLETED",
    },
  });

  console.log("✅ Created sample payment");

  // Update fee record with payment
  const feeRecord = await prisma.feeRecord.findFirst({
    where: {
      studentId: students[0].id,
      academicYear: "2024",
      term: 3,
    },
  });

  if (feeRecord) {
    await prisma.feeRecord.update({
      where: { id: feeRecord.id },
      data: {
        paidAmount: 5000,
        balance: Number(feeRecord.totalAmount) - 5000,
        status: "PARTIAL",
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        feeRecordId: feeRecord.id,
      },
    });

    console.log("✅ Updated fee record with payment");
  }

  console.log("🎉 Seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- School:", school.name);
  console.log("- School Code:", school.code);
  console.log("- Classes:", classes.length);
  console.log("- Students:", students.length);
  console.log("- Parents:", 2);
  console.log("\n🔑 Test Login:");
  console.log("Note: You'll need to create a user account via Better Auth");
  console.log("\n💳 M-Pesa Test:");
  console.log("- Use sandbox shortcode: 174379");
  console.log("- Test phone: 254708374149");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
