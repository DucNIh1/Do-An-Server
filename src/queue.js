import { Queue } from "bullmq";
import redisClient from "./redis/config.js";

export const notificationQueue = new Queue("notifications", {
  connection: redisClient,
});

export const deleteImageQueue = new Queue("deleteImage", {
  connection: redisClient,
});

export const emailQueue = new Queue("email", { connection: redisClient });
