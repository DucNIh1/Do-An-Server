import multer from "multer";
import express from "express";
import cloudinary from "../cloudinary/config.js";
import checkAuth from "../middlewares/checkAuth.js";
const router = express.Router();

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/",
  // checkAuth,
  upload.single("image"),
  async function (req, res, next) {
    try {
      console.log(req.file);
      const result = await cloudinary.uploader.upload(req.file.path);
      res.status(200).json({ message: "Tải ảnh lên thành công", data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/", async function (req, res, next) {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "Thiếu public_id để xóa ảnh" });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      res.status(200).json({ message: "Xóa ảnh thành công" });
    } else {
      res.status(400).json({ message: "Không thể xóa ảnh", result });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
