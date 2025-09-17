import prisma from "../utils/prisma.js";
import catchAsync from "../utils/CatchAsync.js";
import AppError from "../utils/AppError.js";
import { Role } from "../../generated/prisma/index.js";

export const getUsers = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10, search, isActive, role } = req.query;

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      role ? { role: { equals: role } } : {},
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
      avatar: true,
      role: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
      major: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
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

export const restoreUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return next(new AppError("Không tìm thấy người dùng", 404));

  const restoredUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: true,
      deletedAt: null,
    },
  });

  res.json({
    success: true,
    message: "Khôi phục người dùng thành công",
    data: restoredUser,
  });
});

export const updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, majorId } = req.body;

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (role === Role.ADVISOR && !majorId) {
    return res
      .status(400)
      .json({ message: "Vui lòng chọn ngành mà tư vấn viên phụ trách" });
  }

  await prisma.user.update({
    where: { id },
    data: {
      role,
      majorId: role === Role.ADVISOR ? majorId : null,
    },
  });

  res.json({ message: "Cập nhật người dùng thành công" });
});

export const rateAdvisorController = async (req, res, next) => {
  try {
    const { postId, score, comment } = req.body;
    const teacherId = req.params.id;
    const { userId: raterId } = req.user;

    if (!postId || !score) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu postId hoặc score",
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return res
        .status(404)
        .json({ status: "error", message: "Bài viết không tồn tại" });
    }

    if (post.authorId !== raterId) {
      return res.status(403).json({
        status: "error",
        message: "Bạn chỉ có thể chấm điểm tư vấn viên trong bài viết của bạn",
      });
    }

    const teacherComment = await prisma.comment.findFirst({
      where: {
        postId,
        authorId: teacherId,
      },
    });

    if (!teacherComment) {
      return res.status(400).json({
        status: "error",
        message:
          "Bạn chỉ có thể chấm điểm tư vấn viên đã tư vấn trong bài viết của bạn",
      });
    }

    const existingRating = await prisma.userRating.findFirst({
      where: {
        teacherId,
        raterId,
        postId,
      },
    });

    if (existingRating) {
      return res.status(400).json({
        status: "error",
        message: "Bạn đã chấm điểm tư vấn viên này trong bài viết này rồi",
      });
    }

    const rating = await prisma.userRating.create({
      data: {
        teacherId,
        raterId,
        postId,
        score,
        comment,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Đánh giá tư vấn viên thành công",
      data: rating,
    });
  } catch (error) {
    next(error);
  }
};

export const checkRatedAdvisorController = async (req, res, next) => {
  try {
    const teacherId = req.params.id;
    const { postId } = req.query;
    const { userId: raterId } = req.user;

    if (!postId) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu postId trong query",
      });
    }

    const rating = await prisma.userRating.findFirst({
      where: {
        teacherId,
        raterId,
        postId,
      },
    });

    return res.status(200).json({
      hasRated: !!rating,
      rating,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdvisorsWithRatingsController = async (req, res, next) => {
  try {
    const advisors = await prisma.user.findMany({
      where: {
        role: "ADVISOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        major: true,
      },
    });

    const advisorsWithRatings = await Promise.all(
      advisors.map(async (advisor) => {
        const ratings = await prisma.userRating.findMany({
          where: {
            teacherId: advisor.id,
          },
          include: {
            rater: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        const totalScore = ratings.reduce(
          (sum, rating) => sum + rating.score,
          0
        );
        const averageScore =
          ratings.length > 0
            ? parseFloat((totalScore / ratings.length).toFixed(2))
            : 0;

        return {
          ...advisor,
          averageScore,
          ratings,
        };
      })
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách tư vấn viên thành công",
      data: advisorsWithRatings,
    });
  } catch (error) {
    next(error);
  }
};
