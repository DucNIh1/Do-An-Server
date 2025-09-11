import prisma from "../utils/prisma.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, text, imageIds } = req.body;
    const senderId = req.user.userId;

    if (!conversationId && !receiverId) {
      return res.status(400).json({
        message: "Thiếu conversationId (chat nhóm) hoặc receiverId (DM).",
      });
    }

    let conversation = null;

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true },
      });
      if (!conversation) {
        return res.status(404).json({ message: "Conversation không tồn tại." });
      }

      const isMember = conversation.members.some((m) => m.userId === senderId);
      if (!isMember) {
        return res
          .status(403)
          .json({ message: "Bạn không thuộc hội thoại này." });
      }
    }

    if (!conversationId && receiverId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: senderId } } },
            { members: { some: { userId: receiverId } } },
          ],
        },
        include: { members: true },
      });

      if (!conversation) {
        const createdConv = await prisma.conversation.create({
          data: { isGroup: false },
        });

        await prisma.conversationMember.createMany({
          data: [
            { userId: senderId, conversationId: createdConv.id },
            { userId: receiverId, conversationId: createdConv.id },
          ],
          skipDuplicates: true,
        });

        conversation = await prisma.conversation.findUnique({
          where: { id: createdConv.id },
          include: { members: true },
        });
      }
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          text: text ?? "",
          senderId,
          conversationId: conversation.id,
        },
      });

      if (Array.isArray(imageIds) && imageIds.length > 0) {
        await tx.image.updateMany({
          where: { id: { in: imageIds } },
          data: { messageId: createdMessage.id },
        });
      }

      const fullMessage = await tx.message.findUnique({
        where: { id: createdMessage.id },
        select: {
          id: true,
          text: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              publicId: true,
            },
          },
        },
      });

      const members = await tx.conversationMember.findMany({
        where: { conversationId: conversation.id },
      });
      const memberIds = members.map((m) => m.userId);
      const recipientIds = memberIds.filter((id) => id !== senderId);

      return { fullMessage, memberIds, recipientIds };
    });

    const { fullMessage, recipientIds } = txResult;

    if (req.io) {
      recipientIds.forEach((uid) => {
        req.io.to(uid).emit("newMessage", {
          conversationId: conversation.id,
          message: fullMessage,
        });
      });
    }

    return res.status(201).json({
      success: true,
      data: { conversationId: conversation.id, message: fullMessage },
    });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const {
      conversationId,
      senderId,
      receiverId,
      limit = 20,
      cursor,
      before,
      after,
    } = req.query;

    const messageLimit = Math.min(Math.max(parseInt(limit), 1), 50);

    let targetConversationId = conversationId;

    if (!conversationId && senderId && receiverId) {
      if (senderId === receiverId) {
        return res.status(400).json({
          success: false,
          message: "senderId và receiverId không thể giống nhau",
        });
      }

      const conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          members: {
            every: {
              userId: { in: [senderId, receiverId] },
            },
          },
          AND: [
            { members: { some: { userId: senderId } } },
            { members: { some: { userId: receiverId } } },
          ],
        },
        select: { id: true },
      });

      if (!conversation) {
        return res.status(200).json({
          success: true,
          data: {
            messages: [],
            conversation: null,
            pagination: {
              hasMore: false,
              nextCursor: null,
              prevCursor: null,
            },
          },
        });
      }

      targetConversationId = conversation.id;
    }

    if (!targetConversationId) {
      return res.status(400).json({
        success: false,
        message:
          "Cần cung cấp conversationId hoặc cặp senderId/receiverId hợp lệ",
      });
    }

    const conversationExists = await prisma.conversation.findUnique({
      where: { id: targetConversationId },
      select: { id: true, name: true, isGroup: true },
    });
    if (!conversationExists) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }

    let whereConditions = {
      conversationId: targetConversationId,
    };

    if (before) {
      whereConditions.createdAt = { lt: new Date(before) };
    } else if (after) {
      whereConditions.createdAt = { gt: new Date(after) };
    } else if (cursor) {
      whereConditions.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.message.findMany({
      where: whereConditions,
      orderBy: { createdAt: "desc" },
      take: messageLimit + 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            publicId: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const hasMore = messages.length > messageLimit;
    const actualMessages = hasMore ? messages.slice(0, messageLimit) : messages;

    let nextCursor = null;
    let prevCursor = null;

    if (actualMessages.length > 0) {
      nextCursor = hasMore
        ? actualMessages[actualMessages.length - 1].createdAt.toISOString()
        : null;

      prevCursor = actualMessages[0].createdAt.toISOString();
    }

    const formattedMessages = actualMessages.map((message) => ({
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        avatar: message.sender.avatar,
        role: message.sender.role,
      },
      images: message.images.map((image) => ({
        id: image.id,
        url: image.url,
        publicId: image.publicId,
      })),
      hasImages: message.images.length > 0,
      messageType: message.images.length > 0 ? "image" : "text",
    }));

    return res.status(200).json({
      success: true,
      data: {
        messages: formattedMessages,
        conversation: {
          id: conversationExists.id,
          name: conversationExists.name,
          isGroup: conversationExists.isGroup,
        },
        pagination: {
          hasMore,
          nextCursor,
          prevCursor,
          limit: messageLimit,
          count: actualMessages.length,
        },
      },
    });
  } catch (err) {
    console.error("Error in getMessages:", err);
    next(err);
  }
};
