import prisma from "../utils/prisma.js";
import { sendConsultationSuccessEmail } from "../nodemail/mail.js";
import catchAsync from "../utils/CatchAsync.js";
import { RequestStatus } from "../../generated/prisma/index.js";
import { emailQueue } from "../queue.js";

export const getConsultationRequests = catchAsync(async (req, res, next) => {
  const {
    status,
    majorId,
    page = 1,
    limit = 10,
    sort = "desc",
    search,
  } = req.query;

  const currentPage = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (currentPage - 1) * pageSize;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (majorId) whereClause.majorId = majorId;

  if (search) {
    whereClause.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const totalRequests = await prisma.consultationRequest.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalRequests / pageSize);

  const requests = await prisma.consultationRequest.findMany({
    where: whereClause,
    skip,
    take: pageSize,
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    include: {
      major: {
        select: { id: true, name: true },
      },
    },
  });

  res.status(200).json({
    requests,
    totalPage: totalPages,
    currentPage,
    limit: pageSize,
  });
});

export const createConsultationRequest = catchAsync(async (req, res, next) => {
  const { fullName, phoneNumber, email, majorId, address, birthDate } =
    req.body;

  const lastRequest = await prisma.consultationRequest.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (lastRequest) {
    const now = new Date();
    const createdAt = new Date(lastRequest.createdAt);
    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (lastRequest.status !== "DONE" && diffDays < 1) {
      return res.status(400).json({
        message: `Bạn đã gửi yêu cầu tư vấn trước đó và chưa được xử lý xong. Vui lòng chờ hoặc thử lại sau 1 ngày.`,
      });
    }
  }

  const newRequest = await prisma.consultationRequest.create({
    data: {
      fullName,
      phoneNumber,
      email,
      majorId,
      address,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
    include: {
      major: true,
    },
  });

  const majorName = newRequest.major?.name || "";

  const advisors = await prisma.user.findMany({
    where: { majorId: majorId },
    select: { email: true },
  });

  const advisorEmails = advisors.map((advisor) => advisor.email);

  await emailQueue.add("sendConsultationEmails", {
    student: {
      fullName,
      email,
      phoneNumber,
      majorName,
    },
    advisorEmails,
  });

  res.status(201).json({
    message: "Tạo yêu cầu tư vấn thành công, chúng tôi sẽ sớm liên hệ với bạn.",
    request: newRequest,
  });
});

export const updateConsultationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!Object.values(RequestStatus).includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  const updatedRequest = await prisma.consultationRequest.update({
    where: { id },
    data: { status },
  });

  res.status(200).json({
    message: "Cập nhật trạng thái thành công",
    request: updatedRequest,
  });
});

export const deleteConsultationRequest = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await prisma.consultationRequest.delete({ where: { id } });

  res.status(200).json({ message: "Đã xoá yêu cầu tư vấn" });
});
