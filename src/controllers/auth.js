import jwt from "jsonwebtoken";
import {
  loginSchema,
  signupSchema,
} from "../utils/validations/userValidation.js";
import bcrypt from "bcrypt";
import catchAsync from "../utils/CatchAsync.js";
import prisma from "../utils/prisma.js";
import redisClient from "../redis/config.js";
import AppError from "../utils/AppError.js";
import { sendVerificationEmail } from "../nodemail/mail.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GG_CLIENT_ID);

const generateAccessToken = (user, res) => {
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    }
  );

  res.cookie("accessToken", token, {
    httpOnly: true,
    // sameSite: "none",
    // secure: process.env.NODE_ENV === "production" ? true : false,
    maxAge: 1000 * 60 * 60 * 24,
  });

  return token;
};

// SIGNUP
export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  const avatar =
    "https://avatar.freepik.com/premium-vector/boy-work-computers_987671-48.jpg?semt=ais_hybrid";

  const { error } = signupSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return next(new AppError("Email đã được đăng ký.", 400));
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashPassword,
      name,
      avatar,
    },
  });

  const userId = newUser.id;

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const verifyKey = `verify:${userId}`;
  await redisClient.set(verifyKey, verificationToken, "EX", 60 * 60 * 24);

  await sendVerificationEmail(email, verificationToken);

  res.status(201).json({
    message: "Đăng kí tài khoản thành công, vui lòng kiểm tra email của bạn",
    id: userId,
  });
});

// LOGIN
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const { error } = loginSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return next(new AppError("Tài khoản hoặc mật khẩu không chính xác", 400));
  }
  if (user.isActive === false) {
    return next(
      new AppError("Tài khoản của bạn đã bị khoá do vi phạm chính sách!", 401)
    );
  }
  if (user.googleId) {
    return next(
      new AppError(
        "Vui lòng đăng nhập bằng Google với tài khoản email này",
        400
      )
    );
  }

  const comparePassword = bcrypt.compare(password, user.password);
  if (!comparePassword) {
    return next(new AppError("Tài khoản hoặc mật khẩu không chính xác", 400));
  }

  if (user.isVerified === 0) {
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const verifyKey = `verify:${user.id}`;
    await redisClient.set(verifyKey, verificationToken, "EX", 60 * 60 * 24);

    await sendVerificationEmail(email, verificationToken);

    return res
      .status(200)
      .json({ message: "Vui lòng xác thực email của bạn", id: user.id });
  }

  const accessToken = generateAccessToken(user, res);

  res.status(200).json({
    message: "Đăng nhập thành công",
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
  });
});

// LOGIN GOOGLE
export const loginWithGoogle = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GG_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: payload.sub }, { email: payload.email }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        googleId: payload.sub,
        isVerified: true,
      },
    });
  }

  const accessToken = generateAccessToken(user, res);
  res.status(200).json({
    message: "Đăng nhập thành công",
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
  });
});

//LOGOUT
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const { userId } = req.query;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng", 404));
  }

  const verifyCode = await redisClient.get(`verify:${userId}`);
  if (!verifyCode || code !== verifyCode) {
    return next(new AppError("Mã xác thực không hợp lệ", 400));
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });

  const accessToken = generateAccessToken(user, res);

  await redisClient.del(`verify:${userId}`);

  res.status(200).json({
    message: "Xác thực tài khoản thành công",
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
  });
});
