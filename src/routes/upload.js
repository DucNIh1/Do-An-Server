import multer from "multer";
import express from "express";
import cloudinary from "../cloudinary/config.js";
import checkAuth from "../middlewares/checkAuth.js";
import AppError from "../utils/AppError.js";
import prisma from "../utils/prisma.js";

const router = express.Router();

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.array("images", 10), async (req, res) => {
  try {
    const { folder = "others", postId, messageId, commentId } = req.body;

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, { folder });

        return prisma.image.create({
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            postId: postId || null,
            messageId: messageId || null,
            commentId: commentId || null,
          },
        });
      })
    );

    res.json({ message: "Tải ảnh lên thành công", data: uploadedImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tải ảnh lên thất bại!" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return new AppError("Vui lòng cung cấp ids", 400);
    }

    const images = await prisma.image.findMany({
      where: { id: { in: ids } },
    });

    await Promise.all(
      images.map((img) => cloudinary.uploader.destroy(img.publicId))
    );

    await prisma.image.deleteMany({
      where: { id: { in: ids } },
    });

    res.json({ message: "Xoá ảnh thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Xoá ảnh thất bại" });
  }
});

export default router;
