import { NotificationType, Role } from "../../generated/prisma/index.js";
import { notificationQueue } from "../queue.js";
import prisma from "../utils/prisma.js";

export const addUsersToConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const currentUser = req.user;

    if (currentUser.role === Role.STUDENT) {
      return res.status(403).json({ message: "Bạn không có quyền" });
    }

    await prisma.conversationMember.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        conversationId: id,
      })),
      skipDuplicates: true,
    });

    userIds.forEach((uid) => {
      if (req.io && req.io.to) {
        req.io.to(uid).emit("memberAdded", {
          conversationId: id,
          addedBy: currentUser.userId,
        });
      }
    });

    await notificationQueue.add("sendNotification", {
      userIds,
      type: NotificationType.CONVERSATION,
      message: `${currentUser.name} đã thêm bạn vào một nhóm chat`,
      link: `${id}`,
      conversationId: id,
      createdBy: {
        id: currentUser.userId,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    });

    return res.status(201).json({ added: userIds });
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { name, userIds } = req.body;
    const currentUser = req.user;

    if (currentUser.role === Role.STUDENT) {
      return res.status(403).json({ message: "Bạn không có quyền tạo nhóm" });
    }
    let conversation;

    conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: name || "Nhóm mới",
        members: {
          create: [
            { userId: currentUser.userId },
            ...(userIds || []).map((uid) => ({ userId: uid })),
          ],
        },
      },
      include: { members: true },
    });
    if (req.io) {
      conversation.members.forEach((m) => {
        req.io
          .to(m.userId)
          .emit(`Bạn đã trở thành thành viên của nhóm ${name}`);
      });
    }

    return res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const { search } = req.query;
    const { userId } = req.user;

    const whereClause = {
      members: {
        some: { userId },
      },
    };

    if (search) {
      whereClause.OR = [
        {
          name: { contains: search, mode: "insensitive" },
        },
        {
          members: {
            some: {
              user: {
                name: { contains: search, mode: "insensitive" },
              },
              NOT: { userId }, // exclude chính user hiện tại
            },
          },
        },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: { select: { id: true, name: true } },
            images: { select: { id: true, url: true, publicId: true } },
          },
        },
      },
    });

    const result = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = c.messages[0];
        const currentMember = c.members.find((m) => m.userId === userId);

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            createdAt: {
              gt: currentMember?.lastReadAt ?? new Date(0),
            },
            senderId: { not: userId },
          },
        });

        const hasUnread = unreadCount > 0;

        return {
          ...c,
          hasUnread,
          unreadCount,
        };
      })
    );

    const sorted = result.sort((a, b) => {
      const aTime = a.messages[0]?.createdAt ?? new Date(0);
      const bTime = b.messages[0]?.createdAt ?? new Date(0);
      return bTime - aTime;
    });

    res.status(200).json(sorted);
  } catch (err) {
    next(err);
  }
};

export const leaveConversation = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const { userId } = req.user;

    const member = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của cuộc hội thoại này.",
      });
    }

    const remainingMembers = await prisma.conversationMember.findMany({
      where: {
        conversationId: conversationId,
        NOT: { userId: userId },
      },
    });

    await prisma.conversationMember.delete({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    if (req.io) {
      remainingMembers.forEach((mem) => {
        req.io.to(mem.userId).emit("memberLeft", {
          conversationId: conversationId,
          leftUserId: userId,
        });
      });
    }

    const remainingCount = await prisma.conversationMember.count({
      where: { conversationId: conversationId },
    });

    if (remainingCount === 0) {
      await prisma.message.deleteMany({
        where: { conversationId: conversationId },
      });
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
    }

    res.status(200).json({ message: "Bạn đã rời khỏi cuộc hội thoại." });
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser.role === Role.STUDENT) {
      return res.status(403).json({ message: "Bạn không có quyền xoá nhóm" });
    }

    await prisma.message.deleteMany({ where: { conversationId: id } });

    await prisma.conversationMember.deleteMany({
      where: { conversationId: id },
    });

    await prisma.conversation.delete({ where: { id } });

    if (req.io) {
      req.io.to(id).emit("conversationDeleted", { conversationId: id });
    }

    res.status(200).json({ message: "Đã xoá hội thoại" });
  } catch (err) {
    next(err);
  }
};

export const renameConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const currentUser = req.user;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên nhóm không được để trống" });
    }

    if (currentUser.role === Role.STUDENT) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền đổi tên nhóm" });
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { name },
      include: { members: true },
    });

    if (req.io) {
      updatedConversation.members.forEach((m) => {
        req.io.to(m.userId).emit("conversationRenamed", {
          conversationId: id,
          newName: name,
          updatedBy: currentUser.userId,
        });
      });
    }

    res.status(200).json(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const removeMemberFromConversation = async (req, res, next) => {
  try {
    const { id: conversationId, userId } = req.params;
    const currentUser = req.user;

    if (currentUser.role === Role.STUDENT) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xoá thành viên" });
    }

    const member = await prisma.conversationMember.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ message: "Người dùng không ở trong nhóm" });
    }

    await prisma.conversationMember.delete({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    await notificationQueue.add("sendNotification", {
      userIds: [userId],
      type: NotificationType.CONVERSATION,
      message: `${currentUser.name} đã xoá bạn khỏi một nhóm chat`,
      conversationId: conversationId,
      createdBy: {
        id: currentUser.userId,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    });
    res.status(200).json({ message: "Đã xoá thành viên khỏi hội thoại" });
  } catch (err) {
    next(err);
  }
};

export const getConversationMembers = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (page - 1) * limit;

    const whereClause = {
      conversationId,
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    };

    const totalCount = await prisma.conversationMember.count({
      where: whereClause,
    });

    const members = await prisma.conversationMember.findMany({
      where: whereClause,
      skip: Number(skip),
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    const results = members.map((m) => m.user);

    return res.status(200).json({
      results,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: +page,
      limit: +limit,
    });
  } catch (err) {
    next(err);
  }
};
