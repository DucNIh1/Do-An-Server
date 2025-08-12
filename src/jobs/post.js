import cron from "node-cron";
import prisma from "../utils/prisma.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Đang chạy auto delete...");

  const days = 30;
  const deleteBefore = new Date();
  deleteBefore.setDate(deleteBefore.getDate() - days);

  try {
    const deletedPosts = await prisma.post.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: deleteBefore },
      },
    });

    console.log(`Đã xoá cứng ${deletedPosts.count} bài viết`);
  } catch (err) {
    console.error("Lỗi khi auto delete post:", err);
  }
});
