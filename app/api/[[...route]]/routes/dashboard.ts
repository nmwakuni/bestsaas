import { Hono } from "hono";
import { db } from "@/lib/db";

const app = new Hono();

// Get dashboard statistics
app.get("/stats", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    const [
      totalStudents,
      activeStudents,
      totalStaff,
      totalClasses,
      totalFeeExpected,
      totalFeeCollected,
      todayPayments,
      weekPayments,
      monthPayments,
      defaultersCount,
    ] = await Promise.all([
      // Total students
      db.student.count({
        where: { schoolId },
      }),
      // Active students
      db.student.count({
        where: { schoolId, status: "ACTIVE" },
      }),
      // Total staff
      db.staff.count({
        where: { schoolId, status: "ACTIVE" },
      }),
      // Total classes
      db.class.count({
        where: { schoolId },
      }),
      // Total fee expected
      db.feeRecord.aggregate({
        where: {
          student: {
            schoolId,
            status: "ACTIVE",
          },
        },
        _sum: { totalAmount: true },
      }),
      // Total fee collected
      db.feeRecord.aggregate({
        where: {
          student: {
            schoolId,
            status: "ACTIVE",
          },
        },
        _sum: { paidAmount: true },
      }),
      // Today's payments
      db.payment.aggregate({
        where: {
          schoolId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // This week's payments
      db.payment.aggregate({
        where: {
          schoolId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
        _sum: { amount: true },
      }),
      // This month's payments
      db.payment.aggregate({
        where: {
          schoolId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      // Fee defaulters
      db.feeRecord.count({
        where: {
          student: {
            schoolId,
            status: "ACTIVE",
          },
          balance: {
            gt: 0,
          },
        },
      }),
    ]);

    const collectionRate =
      totalFeeExpected._sum.totalAmount && Number(totalFeeExpected._sum.totalAmount) > 0
        ? (Number(totalFeeCollected._sum.paidAmount || 0) /
            Number(totalFeeExpected._sum.totalAmount)) *
          100
        : 0;

    return c.json({
      students: {
        total: totalStudents,
        active: activeStudents,
      },
      staff: {
        total: totalStaff,
      },
      classes: {
        total: totalClasses,
      },
      fees: {
        expected: totalFeeExpected._sum.totalAmount || 0,
        collected: totalFeeCollected._sum.paidAmount || 0,
        balance:
          Number(totalFeeExpected._sum.totalAmount || 0) -
          Number(totalFeeCollected._sum.paidAmount || 0),
        collectionRate: Math.round(collectionRate),
        defaultersCount,
      },
      payments: {
        today: {
          amount: todayPayments._sum.amount || 0,
          count: todayPayments._count,
        },
        week: {
          amount: weekPayments._sum.amount || 0,
        },
        month: {
          amount: monthPayments._sum.amount || 0,
        },
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get recent activities
app.get("/activities", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    const [recentPayments, recentStudents] = await Promise.all([
      // Recent payments
      db.payment.findMany({
        where: {
          schoolId,
          status: "COMPLETED",
        },
        include: {
          student: {
            include: {
              class: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      // Recently added students
      db.student.findMany({
        where: {
          schoolId,
        },
        include: {
          class: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return c.json({
      recentPayments,
      recentStudents,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get payment trends (for charts)
app.get("/payment-trends", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");
    const days = parseInt(c.req.query("days") || "30");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    // Get payments grouped by date
    const payments = await db.payment.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      },
      select: {
        amount: true,
        createdAt: true,
        paymentMethod: true,
      },
    });

    // Group by date
    const grouped = payments.reduce((acc: any, payment: any) => {
      const date = new Date(payment.createdAt).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          mpesa: 0,
          cash: 0,
          bank: 0,
          count: 0,
        };
      }
      acc[date].total += Number(payment.amount);
      acc[date].count += 1;

      if (payment.paymentMethod === "MPESA") {
        acc[date].mpesa += Number(payment.amount);
      } else if (payment.paymentMethod === "CASH") {
        acc[date].cash += Number(payment.amount);
      } else if (payment.paymentMethod === "BANK_TRANSFER") {
        acc[date].bank += Number(payment.amount);
      }

      return acc;
    }, {});

    const trends = Object.values(grouped);

    return c.json(trends);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
