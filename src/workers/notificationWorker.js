import { Worker } from "bullmq";
import prisma from "../utils/prisma.js";
import redisClient from "../redis/config.js";
import { getIO } from "../socket/socketInstance.js";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const io = getIO();
    const {
      userIds,
      type,
      message,
      link,
      postId,
      commentId,
      messageId,
      createdBy,
    } = job.data;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { count: 0 };
    }

    await prisma.notification.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        type,
        message,
        link,
        postId,
        commentId,
        messageId,
        createdById: createdBy.id,
      })),
    });

    userIds.forEach((uid) => {
      io.to(uid).emit("newNotification", {
        type,
        message,
        link,
        postId,
        commentId,
        messageId,
        createdBy,
      });
    });

    return { count: userIds.length };
  },
  {
    connection: redisClient,
    concurrency: 5,
  }
);
