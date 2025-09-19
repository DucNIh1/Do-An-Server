import { Worker } from "bullmq";
import redisClient from "../redis/config.js";
import {
  sendAdvisorNotificationEmail,
  sendConsultationSuccessEmail,
} from "../nodemail/mail.js";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    if (job.name === "sendConsultationEmails") {
      const { student, advisorEmails } = job.data;

      try {
        const sendToStudentPromise = sendConsultationSuccessEmail({
          fullName: student.fullName,
          email: student.email,
          phoneNumber: student.phoneNumber,
        });

        const sendToAdvisorsPromises = advisorEmails.map((advisorEmail) => {
          return sendAdvisorNotificationEmail({
            advisorEmail,
            studentInfo: student,
          });
        });

        await Promise.all([sendToStudentPromise, ...sendToAdvisorsPromises]);
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);
        throw error;
      }
    }
  },
  { connection: redisClient, concurrency: 5 }
);
