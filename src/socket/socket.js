import jwt from "jsonwebtoken";
import cookie from "cookie";
import AppError from "../utils/AppError.js";

const userSocketMap = new Map();

export const getUserSocketMap = () => userSocketMap;

export const initializeSocket = (io) => {
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.accessToken;
      if (!token) {
        return next(
          new AppError("Authentication error: No token in cookie", 401)
        );
      }

      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      socket.userId = payload.userId;
      socket.role = payload.role;
      socket.name = payload.name;
      socket.avatar = payload.avatar;
      socket.email = payload.email;

      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User ${socket.userId} connected with socket ${socket.id}`);

    socket.join(socket.userId);

    const user = {
      userId: socket.userId,
      role: socket.role,
      name: socket.name,
      avatar: socket.avatar,
      email: socket.email,
    };

    if (!userSocketMap.has(socket.userId)) {
      userSocketMap.set(socket.userId, { user, sockets: [] });
    }

    userSocketMap.get(socket.userId).sockets.push(socket.id);

    emitOnlineUsers(io);

    socket.on("disconnect", () => {
      console.log(
        `❌ User ${socket.userId} disconnected from socket ${socket.id}`
      );

      const entry = userSocketMap.get(socket.userId);
      if (entry) {
        entry.sockets = entry.sockets.filter((id) => id !== socket.id);
        if (entry.sockets.length === 0) {
          userSocketMap.delete(socket.userId);
        }
      }

      emitOnlineUsers(io);
    });
  });
};

const emitOnlineUsers = (io) => {
  const onlineUsers = Array.from(userSocketMap.values()).map(
    (entry) => entry.user
  );
  io.emit("getOnlineUsers", onlineUsers);
};
