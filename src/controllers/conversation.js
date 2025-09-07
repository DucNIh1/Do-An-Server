import { Role } from "../../generated/prisma/index.js";
import prisma from "../utils/prisma.js";

export const addUsersToConversation = async (req, res, next) => {
  try {
    const { id } = req.params; // conversationId
    const { userIds } = req.body;
    const currentUser = req.user;

    if (currentUser.role === Role.STUDENT) {
      return res.status(403).json({ message: "Bạn không có quyền" });
    }

    // Thêm các user mới
    const members = await prisma.conversationMember.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        conversationId: id,
      })),
      skipDuplicates: true,
    });

    // Emit socket cho user vừa được thêm
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
          .emit(
            `conversationCreated", "Bạn đã trở thành thành viên của nhóm ${name}`
          );
      });
    }

    return res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};
