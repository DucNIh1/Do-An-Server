import express from "express";
import {
  changePostStatus,
  checkUserLiked,
  checkUserRatedPost,
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getCommentById,
  getMyPosts,
  getPost,
  getPostComments,
  getPostLikes,
  getPosts,
  getReleatedPosts,
  getTopPosts,
  ratePost,
  setFeaturedPost,
  toggleLike,
  updateComment,
  updatePost,
  updatePostRating,
} from "../controllers/post.js";
import checkAuth from "../middlewares/checkAuth.js";
import checkRole from "../middlewares/checkRole.js";

const router = express.Router();

router.patch("/:id/status", checkAuth, checkRole("ADMIN"), changePostStatus);

router.patch(
  "/:id/featured-post",
  checkAuth,
  checkRole("ADMIN"),
  setFeaturedPost
);
router.patch("/:id/rating", checkAuth, updatePostRating);

router.get("/releated", getReleatedPosts);
router.get("/my-posts", checkAuth, getMyPosts);

router.get("/top", getTopPosts);
router.route("/").get(getPosts).post(checkAuth, createPost);
router.post("/:id/rate", checkAuth, ratePost);
router.get("/:id/check-rating", checkAuth, checkUserRatedPost);
router
  .route("/:id")
  .get(getPost)
  .delete(checkAuth, deletePost)
  .put(checkAuth, updatePost);

router.post("/:postId/like", checkAuth, toggleLike);

router.get("/:postId/likes", getPostLikes);

router.get("/:postId/like/check", checkAuth, checkUserLiked);

router.post("/:postId/comments", checkAuth, createComment);

router.get("/:postId/comments", getPostComments);

router.put("/comments/:commentId", checkAuth, updateComment);
router.get("/comments/:commentId", getCommentById);

router.delete("/comments/:commentId", checkAuth, deleteComment);

export default router;
