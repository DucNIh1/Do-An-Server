import { Role } from "../../generated/prisma/index.js";
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

    return res.status(201).json({ added: userIds });
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { name, userIds } = req.body;
    const currentUser = req.user;

    if (!isGroup && currentUser.role === Role.STUDENT) {
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
        some: {
          userId: userId,
        },
      },
    };

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          members: {
            some: {
              user: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              NOT: {
                userId: userId,
              },
            },
          },
        },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
            images: { select: { url: true, id: true, publicId: true } },
          },
        },
      },
    });

    res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
};

export const leaveConversation = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

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
