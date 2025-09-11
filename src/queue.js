import { Queue } from "bullmq";
import redisClient from "./redis/config.js";

export const notificationQueue = new Queue("notifications", {
  connection: redisClient,
});
