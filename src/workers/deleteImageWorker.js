import { Worker } from "bullmq";
import redisClient from "../redis/config.js";
import cloudinary from "../cloudinary/config.js";

export const deleteImageWorker = new Worker(
  "deleteImage",
  async (job) => {
    const { publicId } = job.data;
    await cloudinary.uploader.destroy(publicId);
  },
  {
    connection: redisClient,
    concurrency: 5,
  }
);
