import cron from "node-cron";
import prisma from "../utils/prisma.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Đang chạy auto delete major & user...");

  const now = new Date();
  const days = 30;
  const deleteBefore = new Date(now.setDate(now.getDate() - days));

  try {
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { isVerified: false, createdAt: { lte: deleteBefore } },
          { isActive: false, deletedAt: { lte: deleteBefore } },
        ],
      },
    });

    console.log(`Đã xoá cứng ${deletedUsers.count} người dùng`);
  } catch (err) {
    console.error("Lỗi khi auto delete:", err);
  }
});
