import prisma from "../utils/prisma.js";

export const getMonthlyRegistrations = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year, 10) : currentYear;

    if (
      isNaN(targetYear) ||
      targetYear < 2000 ||
      targetYear > currentYear + 1
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const rawQuery = `
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*)::int as count
      FROM "User"
      WHERE EXTRACT(YEAR FROM "createdAt") = $1
      GROUP BY month
      ORDER BY month ASC;
    `;

    const result = await prisma.$queryRawUnsafe(rawQuery, targetYear);

    const formattedData = result.map((row) => ({
      month: new Date(row.month).toLocaleDateString("vi-VN", {
        month: "short",
        year: "numeric",
      }),
      count: row.count,
    }));

    // Lấy tổng số người dùng trong năm đã chọn
    const totalUsersInYear = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${targetYear + 1}-01-01T00:00:00.000Z`),
        },
      },
    });

    res.status(200).json({
      monthlyData: formattedData,
      totalUsers: totalUsersInYear,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu đăng ký hàng tháng:", error);
    res
      .status(500)
      .json({ message: "Không thể lấy dữ liệu đăng ký hàng tháng." });
  }
};

export const getMonthlyConsultations = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year, 10) : currentYear;

    if (
      isNaN(targetYear) ||
      targetYear < 2000 ||
      targetYear > currentYear + 1
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const rawQuery = `
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*)::int as count
      FROM "ConsultationRequest"
      WHERE EXTRACT(YEAR FROM "createdAt") = $1
      GROUP BY month
      ORDER BY month ASC;
    `;

    const result = await prisma.$queryRawUnsafe(rawQuery, targetYear);

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i;
      const dataRow = result.find(
        (row) => new Date(row.month).getMonth() === monthIndex
      );
      return {
        month: monthIndex,
        count: dataRow ? dataRow.count : 0,
      };
    });

    res.status(200).json(monthlyData);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu yêu cầu tư vấn:", error);
    res.status(500).json({ message: "Không thể lấy dữ liệu yêu cầu tư vấn." });
  }
};

export const getPostStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyStats = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59);

      const postsCount = await prisma.post.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          isDeleted: false,
          //   status: "verified",
          author: { role: "STUDENT" },
        },
      });

      const interactions = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT (c."postId" || '_' || c."authorId")) AS count
        FROM "Comment" c
        INNER JOIN "Post" p ON c."postId" = p.id
        INNER JOIN "User" u ON c."authorId" = u.id
        WHERE c."createdAt" >= ${startDate}
        AND c."createdAt" <= ${endDate}
        AND p."isDeleted" = false
        -- AND p."status" = 'verified'
        AND u."role" = 'STUDENT'
      `;

      monthlyStats.push({
        month: months[month],
        posts: postsCount,
        interactions: Number(interactions[0]?.count || 0),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        statistics: monthlyStats,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly statistics:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thống kê",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const getGeneralStatistics = async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({
      where: { role: "STUDENT", isActive: true },
    });

    const totalPosts = await prisma.post.count({
      where: {
        isDeleted: false,
        // status: "verified",
        author: {
          role: "STUDENT",
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching general statistics:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thống kê",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
