import express from "express";
import {
  changePostStatus,
  createPost,
  deletePost,
  getMyPosts,
  getPost,
  getPosts,
  getReleatedPosts,
  publishPost,
  setFeaturedPost,
  updatePost,
} from "../controllers/post.js";
import checkAuth from "../middlewares/checkAuth.js";
import checkRole from "../middlewares/checkRole.js";

const router = express.Router();

router.patch("/:id/status", checkAuth, checkRole("admin"), changePostStatus);

router.patch(
  "/:id/featured-post",
  checkAuth,
  checkRole("admin"),
  setFeaturedPost
);

router.get("/releated", getReleatedPosts);
router.get("/my-posts", checkAuth, getMyPosts);

router.route("/").get(getPosts).post(checkAuth, createPost);

router
  .route("/:id")
  .get(getPost)
  .delete(checkAuth, deletePost)
  .put(checkAuth, updatePost);

export default router;
