import catchAsync from "../utils/CatchAsync.js";
import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import {
  NotificationType,
  PostStatus,
  Role,
} from "../../generated/prisma/index.js";
import FilterData from "../utils/FilterData.js";
import { deleteImageQueue, notificationQueue } from "../queue.js";

const filter = async (filters, userId) => {
  const {
    page = 1,
    limit = 4,
    title,
    status,
    sort,
    isFeatured,
    isFromSchool,
    isDeleted,
    majorId,
  } = filters;
  const skip = (+page - 1) * limit;
  const orderBy = { createdAt: sort === "asc" ? "asc" : "desc" };

  let where = { isDeleted: false };

  if (isDeleted !== undefined) where.isDeleted = Boolean(+isDeleted);
  if (title) where.title = { contains: title, mode: "insensitive" };
  if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";
  if (isFromSchool !== undefined) where.isFromSchool = isFromSchool === "true";
  if (status) where.status = status;
  if (majorId) where.majorId = majorId;

  if (userId) {
    where.authorId = userId;
  }

  const [results, totalPosts] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: +skip,
      take: +limit,
      orderBy,
      include: {
        images: true,
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        major: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(totalPosts / limit);
  return {
    results,
    totalPages,
    currentPage: +page,
    limit: +limit,
  };
};

export const getPosts = catchAsync(async (req, res, next) => {
  const { results, totalPages, currentPage, limit } = await filter(req.query);
  res
    .status(200)
    .json({ posts: results, totalPages: totalPages, currentPage, limit });
});

export const getPost = catchAsync(async (req, res, next) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true, role: true },
      },
      images: true,
    },
  });
  if (!post) return next(new AppError("Không tìm thấy bài viết", 404));
  res.status(200).json({ post });
});

export const getMyPosts = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { results, totalPages } = await filter(req.query, userId);
  res.status(200).json({ posts: results, total: totalPages });
});

export const getReleatedPosts = catchAsync(async (req, res, next) => {
  const { postId } = req.query;
  const posts = await prisma.post.findMany({
    where: {
      AND: [
        { NOT: { id: postId } },
        { deleted: false },
        { status: PostStatus.verified },
      ],
    },
    include: {
      author: true,
      images: true,
    },
  });

  if (posts.length === 0) {
    return next(new AppError("Không tìm thấy bài viết liên quan", 404));
  }

  res.status(200).json({ posts });
});

export const setFeaturedPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { isFeatured } = req.body;

  await prisma.post.update({
    where: { id: postId },
    data: { isFeatured: Boolean(+isFeatured) },
  });

  res.json({ message: "The article's isFeatured has been changed." });
});

export const deletePost = catchAsync(async (req, res, next) => {
  const { userId, role } = req.user;
  const id = req.params.id;

  const where = role === Role.STUDENT ? { id, authorId: userId } : { id };

  const post = await prisma.post.findFirst({
    where,
    include: {
      images: true,
    },
  });
  if (!post) {
    return next(
      new AppError(
        "Không tìm thấy bài viết hoặc bạn không thể xoá bài viết này",
        404
      )
    );
  }

  if (post.images?.length > 0) {
    for (const img of post.images) {
      if (img.publicId) {
        await deleteImageQueue.add("deleteImage", { publicId: img.publicId });
      }
    }
  }

  await prisma.post.delete({ where: { id } });
  return res
    .status(200)
    .json({ message: "Xoá bài viết thành công (hard delete)" });
});

export const updatePost = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { title, content, teaser, isFeatured } = req.body;

  const post = await prisma.post.findFirst({
    where: { id: id, authorId: userId },
  });
  if (!post) return next(new AppError("Không tìm thấy bài viết", 404));

  await prisma.post.update({
    where: { id: id },
    data: { title, content, isFeatured, teaser },
  });

  res.status(200).json({ message: "Cập nhật bài viết thành công" });
});

export const createPost = catchAsync(async (req, res, next) => {
  const { userId, role } = req.user;
  const { title, content, teaser, isFromSchool, majorId, isFeatured } =
    req.body;
  let status = req.body.status;

  if (role === Role.STUDENT) {
    status = PostStatus.pending;
  }

  if (!title || !content)
    return next(new AppError("Vui lòng điền đầy đủ thông tin yêu cầu", 400));

  if (isFromSchool && !teaser)
    return next(
      new AppError("Bài viết của trường học cần có đoạn giới thiệu ngắn ", 400)
    );

  const data = FilterData({
    title,
    content,
    teaser,
    status,
    isFromSchool,
    majorId,
    isFeatured,
    authorId: userId,
  });
  const newPost = await prisma.post.create({ data });

  res
    .status(201)
    .json({ message: "Tạo mới bài viết thành công", data: newPost });
});

export const publishPost = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const post = await prisma.post.findFirst({
    where: { id, status: { in: [PostStatus.draft, PostStatus.pending] } },
  });

  if (!post)
    return res.status(404).json({
      message: "Không tìm thấy bài viết hoặc bài viết đã được xuất bản",
    });

  await prisma.post.update({
    where: { id: id },
    data: { status: PostStatus.verified },
  });
  res.status(200).json({ message: "Xuất bản bài viết thành công" });
});

export const changePostStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const updated = await prisma.post.update({
    where: { id: id },
    data: { status },
  });
  if (!updated) return next(new AppError("Thay đổi trạng thái thất bại"));

  res.status(200).json({ message: "Thay đổi bài viết thành công" });
});

export const toggleLike = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const currentUser = req.user;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
    },
  });
  if (!post) {
    return next(new AppError("Bài viết không tồn tại", 404));
  }

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: currentUser.userId,
      postId,
    },
  });

  let isLiked;
  let totalLikes;

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
    isLiked = false;
  } else {
    await prisma.like.create({
      data: {
        userId: currentUser.userId,
        postId,
      },
    });
    isLiked = true;
  }

  totalLikes = await prisma.like.count({
    where: { postId },
  });

  if (isLiked && post.author.id !== currentUser.userId) {
    await notificationQueue.add("sendNotification", {
      userIds: [post.authorId],
      type: NotificationType.LIKE,
      message: `${currentUser.name} đã thích bài đăng của bạn`,
      postId: postId,
      link: `${postId}`,
      createdBy: {
        id: currentUser.userId,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: isLiked ? "Đã thích bài viết" : "Đã bỏ thích bài viết",
    data: {
      isLiked,
      totalLikes,
    },
  });
});

export const getPostLikes = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (+page - 1) * +limit;

  const [likes, totalLikes] = await Promise.all([
    prisma.like.findMany({
      where: { postId },
      skip,
      take: +limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
      },
    }),
    prisma.like.count({ where: { postId } }),
  ]);

  const totalPages = Math.ceil(totalLikes / +limit);

  res.status(200).json({
    success: true,
    data: {
      likes: likes.map((like) => ({
        id: like.id,
        user: like.user,
        createdAt: like.createdAt,
      })),
      totalLikes,
      totalPages,
      currentPage: +page,
      limit: +limit,
    },
  });
});

export const createComment = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;
  const currentUser = req.user;

  if (text.length > 1000) {
    return next(
      new AppError("Nội dung comment không được quá 1000 ký tự", 400)
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
    },
  });

  if (!post) {
    return next(new AppError("Bài viết không tồn tại", 404));
  }

  const comment = await prisma.comment.create({
    data: {
      text: text.trim(),
      postId,
      authorId: currentUser.userId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
    },
  });

  const totalComments = await prisma.comment.count({
    where: { postId },
  });

  if (post.author.id !== currentUser.userId)
    await notificationQueue.add("sendNotification", {
      userIds: [post.authorId],
      type: NotificationType.LIKE,
      message: `${currentUser.name} đã bình luận tại đăng của bạn`,
      postId: postId,
      link: `${postId}`,
      createdBy: {
        id: currentUser.userId,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    });

  res.status(201).json({
    success: true,
    message: "Tạo comment thành công",
    data: {
      comment,
      totalComments,
    },
  });
});

export const getPostComments = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { page = 1, limit = 10, sort = "desc" } = req.query;
  const skip = (+page - 1) * +limit;

  const orderBy = { createdAt: sort === "asc" ? "asc" : "desc" };

  const [comments, totalComments] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      skip,
      take: +limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        Images: {
          select: {
            id: true,
            url: true,
            publicId: true,
          },
        },
      },
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  const totalPages = Math.ceil(totalComments / +limit);

  res.status(200).json({
    success: true,
    data: {
      comments,
      totalComments,
      totalPages,
      currentPage: +page,
      limit: +limit,
    },
  });
});

export const updateComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { text } = req.body;
  const { userId } = req.user;

  if (!text || text.trim().length === 0) {
    return next(new AppError("Nội dung comment không được để trống", 400));
  }

  if (text.length > 1000) {
    return next(
      new AppError("Nội dung comment không được quá 1000 ký tự", 400)
    );
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  if (!comment) {
    return next(new AppError("Comment không tồn tại", 404));
  }

  if (comment.authorId !== userId && req.user.role !== "ADMIN") {
    return next(new AppError("Bạn không có quyền sửa comment này", 403));
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { text: text.trim() },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
      Images: {
        select: {
          id: true,
          url: true,
          publicId: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Cập nhật comment thành công",
    data: { comment: updatedComment },
  });
});

export const deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { userId } = req.user;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return next(new AppError("Comment không tồn tại", 404));
  }

  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    select: { authorId: true },
  });

  const canDelete =
    comment.authorId === userId ||
    post.authorId === userId ||
    req.user.role === "ADMIN";

  if (!canDelete) {
    return next(new AppError("Bạn không có quyền xóa comment này", 403));
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  const totalComments = await prisma.comment.count({
    where: { postId: comment.postId },
  });

  res.status(200).json({
    success: true,
    message: "Xóa comment thành công",
    data: { totalComments },
  });
});

export const getCommentById = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      Images: {
        select: {
          id: true,
          url: true,
          publicId: true,
        },
      },
    },
  });

  if (!comment) {
    return next(new AppError("Bình luận không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    data: comment,
  });
});

export const checkUserLiked = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { userId } = req.user;

  const like = await prisma.like.findFirst({
    where: {
      userId,
      postId,
    },
  });

  const totalLikes = await prisma.like.count({
    where: { postId },
  });

  res.status(200).json({
    success: true,
    data: {
      isLiked: !!like,
      totalLikes,
    },
  });
});

export const getTopPosts = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 5;

  const topPosts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      status: "verified",
    },
    select: {
      id: true,
      title: true,
      teaser: true,

      createdAt: true,
      author: {
        select: { id: true, name: true, avatar: true },
      },
      images: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      likes: {
        _count: "desc",
      },
    },
    take: limit,
  });

  res.status(200).json({
    message: "Lấy danh sách bài viết nhiều tương tác thành công",
    data: topPosts,
  });
});
