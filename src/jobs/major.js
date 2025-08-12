import cron from "node-cron";
import prisma from "../utils/prisma.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Đang chạy auto delete major...");

  const days = 7;
  const deleteBefore = new Date();
  deleteBefore.setDate(deleteBefore.getDate() - days);

  try {
    const deleted = await prisma.major.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lte: deleteBefore,
        },
      },
    });

    console.log(`Đã xóa cứng ${deleted.count} ngành học`);
  } catch (err) {
    console.error("Lỗi khi auto delete major:", err);
  }
});
