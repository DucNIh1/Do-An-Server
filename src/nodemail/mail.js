import nodemailer from "nodemailer";
import {
  CONSULTATION_REQUEST_ADVISOR_TEMPLATE,
  CONSULTATION_REQUEST_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

export const sendConsultationSuccessEmail = async ({
  email,
  fullName,
  phoneNumber,
  homeURL,
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_AUTH,
        pass: process.env.PASSWORD_AUTH,
      },
    });

    const html = CONSULTATION_REQUEST_SUCCESS_TEMPLATE.replace(
      "{fullName}",
      fullName
    )
      .replace("{phoneNumber}", phoneNumber)
      .replace("{email}", email)
      .replace("{homeURL}", homeURL || process.env.FRONTEND_URL);

    await transporter.sendMail({
      from: `"Trung Tâm Tư Vấn Tuyển Sinh Trường Đại Học Công Nghiệp Hà Nội" <${process.env.EMAIL_AUTH}>`,
      to: `${email}`,
      subject: "Xác nhận yêu cầu tư vấn của bạn",
      html,
    });
  } catch (error) {
    throw new Error(
      `Error sending consultation success email: ${error.message}`
    );
  }
};

export const sendAdvisorNotificationEmail = async ({
  advisorEmail,
  studentInfo,
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_AUTH,
        pass: process.env.PASSWORD_AUTH,
      },
    });

    const html = CONSULTATION_REQUEST_ADVISOR_TEMPLATE.replace(
      "{fullName}",
      studentInfo.fullName
    )
      .replace("{phoneNumber}", studentInfo.phoneNumber)
      .replace("{email}", studentInfo.email)
      .replace("{majorName}", studentInfo.majorName);

    await transporter.sendMail({
      from: `"Trung Tâm Tư Vấn Tuyển Sinh Trường Đại Học Công Nghiệp Hà Nội" <${process.env.EMAIL_AUTH}>`,
      to: `${advisorEmail}`,
      subject: "Bạn có 1 yêu cầu tư vấn mới",
      html,
    });
  } catch (error) {
    throw new Error(
      `Error sending consultation success email: ${error.message}`
    );
  }
};

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_AUTH,
        pass: process.env.PASSWORD_AUTH,
      },
    });

    await transporter.sendMail({
      from: `Trung Tâm Tư Vấn Tuyển Sinh Trường Đại Học Công Nghiệp Hà Nội" <${process.env.EMAIL_AUTH}>`,
      to: `${email}`,
      subject: "XÁC MINH EMAIL CỦA BẠN",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
    });
  } catch (error) {
    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, url) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_AUTH,
        pass: process.env.PASSWORD_AUTH,
      },
    });

    await transporter.sendMail({
      from: `Trung Tâm Tư Vấn Tuyển Sinh Trường Đại Học Công Nghiệp Hà Nội" <${process.env.EMAIL_AUTH}>`,
      to: `${email}`,
      subject: "Khôi phục mật khẩu của bạn",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", url),
    });
  } catch (error) {
    throw new Error(`Error sending password reset email: ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_AUTH,
        pass: process.env.PASSWORD_AUTH,
      },
    });

    await transporter.sendMail({
      from: `Trung Tâm Tư Vấn Tuyển Sinh Trường Đại Học Công Nghiệp Hà Nội" <${process.env.EMAIL_AUTH}>`,
      to: `${email}`,
      subject: "Mật khẩu của bạn đã được thay đổi",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });
  } catch (error) {
    throw new Error(`Error sending password reset success email: ${error}`);
  }
};
