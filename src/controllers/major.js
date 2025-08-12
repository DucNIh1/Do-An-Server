import catchAsync from "../utils/CatchAsync.js";
import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";

export const getMajors = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, name, code, sort = "asc" } = req.query;

  const skip = (+page - 1) * +limit;
  const orderBy = { name: sort.toLowerCase() === "desc" ? "desc" : "asc" };

  let where = { isDeleted: false };

  if (name) {
    where.name = { contains: name, mode: "insensitive" };
  }
  if (code) {
    where.code = { contains: code, mode: "insensitive" };
  }

  const [majors, total] = await Promise.all([
    prisma.major.findMany({
      where,
      skip,
      take: +limit,
      orderBy,
    }),
    prisma.major.count({ where }),
  ]);

  const totalPages = Math.ceil(total / +limit);

  res.status(200).json({
    majors,
    total,
    totalPages,
    currentPage: +page,
    limit: +limit,
  });
});

export const getMajor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const major = await prisma.major.findUnique({
    where: { id },
  });

  if (!major) return next(new AppError("Không tìm thấy ngành học", 404));
  res.status(200).json({ major });
});

export const createMajor = catchAsync(async (req, res, next) => {
  const { code, name } = req.body;

  if (!code || !name) {
    return next(new AppError("Vui lòng nhập đầy đủ code và name", 400));
  }

  const exists = await prisma.major.findUnique({ where: { code } });
  if (exists) {
    return next(new AppError("Mã ngành đã tồn tại", 400));
  }

  const major = await prisma.major.create({
    data: { code, name },
  });

  res.status(201).json({ message: "Tạo mới ngành học thành công", major });
});

export const updateMajor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { code, name } = req.body;

  const major = await prisma.major.findUnique({ where: { id } });
  if (!major) return next(new AppError("Không tìm thấy ngành học", 404));

  if (code) {
    const codeExists = await prisma.major.findFirst({
      where: {
        code,
        NOT: { id },
      },
    });

    if (codeExists) {
      return next(new AppError("Mã ngành đã tồn tại", 400));
    }
  }

  const updated = await prisma.major.update({
    where: { id },
    data: { code, name },
  });

  res.status(200).json({
    message: "Cập nhật ngành học thành công",
    major: updated,
  });
});

export const deleteMajor = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const major = await prisma.major.findUnique({ where: { id } });
  if (!major) return next(new AppError("Không tìm thấy ngành học", 404));

  if (major.isDeleted) {
    return next(new AppError("Ngành học đã bị xóa trước đó", 400));
  }

  await prisma.major.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  res.status(200).json({ message: "Xóa ngành học thành công (soft delete)" });
});

export const restoreMajor = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const major = await prisma.major.findUnique({ where: { id } });
  if (!major) return next(new AppError("Không tìm thấy ngành học", 404));

  if (!major.isDeleted) {
    return next(new AppError("Ngành học này chưa bị xóa", 400));
  }

  await prisma.major.update({
    where: { id },
    data: { isDeleted: false },
  });

  res.status(200).json({ message: "Khôi phục ngành học thành công" });
});
