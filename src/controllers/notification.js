import catchAsync from "../utils/CatchAsync.js";
import AppError from "../utils/AppError.js";
import prisma from "../utils/prisma.js";

export const getNotifications = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { type, read, page = 1, limit = 10 } = req.query;

  const currentPage = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (currentPage - 1) * pageSize;

  const whereClause = { userId };
  if (type) {
    whereClause.type = type;
  }
  if (read !== undefined) {
    whereClause.read = read === "true";
  }

  const totalNotifications = await prisma.notification.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(totalNotifications / pageSize);

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    skip,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    notifications,
    totalPage: totalPages,
    currentPage,
    limit: pageSize,
  });
});

export const deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const notification = await prisma.notification.findUnique({
    where: { id: id },
  });

  if (!notification || notification.userId !== userId) {
    return next(
      new AppError("Không tìm thấy thông báo hoặc bạn không có quyền xóa", 404)
    );
  }

  await prisma.notification.delete({
    where: { id: id },
  });

  res.status(200).json({ message: "Xóa thông báo thành công" });
});

export const markAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  const notification = await prisma.notification.findUnique({
    where: { id: id },
  });

  if (!notification || notification.userId !== userId) {
    return next(
      new AppError(
        "Không tìm thấy thông báo hoặc bạn không có quyền cập nhật",
        404
      )
    );
  }

  await prisma.notification.update({
    where: { id: id },
    data: { read: true },
  });

  res.status(200).json({ message: "Đã đánh dấu thông báo là đã đọc" });
});

export const markAllAsRead = catchAsync(async (req, res, next) => {
  const { userId } = req.user;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  res
    .status(200)
    .json({ message: "Đã đánh dấu tất cả thông báo chưa đọc là đã đọc" });
});
