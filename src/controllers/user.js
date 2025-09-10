import prisma from "../utils/prisma.js";
import catchAsync from "../utils/CatchAsync.js";
import AppError from "../utils/AppError.js";

export const getUsers = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10, name, email, isActive } = req.query;

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      name ? { name: { contains: name, mode: "insensitive" } } : {},
      email ? { email: { contains: email, mode: "insensitive" } } : {},
    ],
  };

  if (typeof isActive !== "undefined") {
    where.isActive = isActive === "true";
  }

  const totalUsers = await prisma.user.count({ where });

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
    },
  });

  return res.json({
    results: users || [],
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    limit,
  });
});

export const getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) return next(new AppError("Không tìm thấy người dùng", 404));

  res.json({ success: true, data: user });
});

export const softDeleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return next(new AppError("Không tìm thấy người dùng", 404));

  const userAfterDeleted = await prisma.user.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
  res.json({
    success: true,
    message: "Xoá tạm thời người dùng thành công",
    data: userAfterDeleted,
  });
});

export const hardDeleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return next(new AppError("Không tìm thấy người dùng", 404));

  await prisma.user.delete({
    where: { id },
  });
  res.json({ success: true, message: "Người dùng đã bị xoá vĩnh viễn" });
});
