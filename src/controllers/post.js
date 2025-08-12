import catchAsync from "../utils/CatchAsync.js";
import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { PostStatus, Role } from "../../generated/prisma/index.js";
import FilterData from "../utils/FilterData.js";

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
  } = filters;
  const skip = (+page - 1) * limit;
  const orderBy = { createdAt: sort === "asc" ? "asc" : "desc" };

  let where = { isDeleted: false };

  if (isDeleted !== undefined) where.isDeleted = Boolean(+isDeleted);
  if (title) where.title = { contains: title, mode: "insensitive" };
  if (isFeatured !== undefined) where.isFeatured = Boolean(+isFeatured);
  if (isFromSchool !== undefined) where.isFromSchool = Boolean(+isFromSchool);
  if (status) where.status = status;

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
    .json({ posts: results, totalPage: totalPages, currentPage, limit });
});

export const getPost = catchAsync(async (req, res, next) => {
  const post = await prisma.post.findUnique({
    where: { id: +req.params.id },
    include: { user: true },
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

  const post = await prisma.post.findFirst({ where });
  if (!post) {
    return next(
      new AppError(
        "Không tìm thấy bài viết hoặc bạn không thể xoá bài viết này",
        404
      )
    );
  }

  if (role === Role.STUDENT) {
    await prisma.post.delete({ where: { id } });
    return res
      .status(200)
      .json({ message: "Xoá bài viết thành công (hard delete)" });
  } else {
    await prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return res.status(200).json({ message: "Đã xoá bài viết (soft delete)" });
  }
});

export const updatePost = catchAsync(async (req, res, next) => {
  const { authorId } = req.user;
  const { id } = req.params;
  const { title, content, image, teaser } = req.body;

  const post = await prisma.post.findFirst({
    where: { id: id, authorId: authorId },
  });
  if (!post) return next(new AppError("Không tìm thấy bài viết", 404));

  await prisma.post.update({
    where: { id: id },
    data: { title, content, image, teaser },
  });

  res.status(200).json({ message: "Cập nhật bài viết thành công" });
});

export const createPost = catchAsync(async (req, res, next) => {
  const { userId, role } = req.user;
  const { title, content, teaser, isFromSchool, status } = req.body;

  if (role === Role.STUDENT) status = PostStatus.pending;

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
    authorId: userId,
  });
  await prisma.post.create({ data });

  res.status(201).json({ message: "Tạo mới bài viết thành công" });
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
