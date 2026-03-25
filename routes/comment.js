const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const middleware = require("../middleware/auth");

// POST create new comment
router.post(
  "/post/:postId/comment",
  middleware.isLoggedIn,
  upload.single("image"),
  commentController.createComment,
);

// POST to update comment
router.post(
  "/comment/:id/edit",
  middleware.isLoggedIn,
  upload.single("image"),
  commentController.editComment,
);

// POST to handle delete
router.post("/comment/:id/delete", middleware.isLoggedIn, commentController.deleteComment);

// for upvoting comment
router.post("/comment/:id/upvote", middleware.isLoggedIn, commentController.upvoteComment);

// for downvoting a comment
router.post("/comment/:id/downvote", middleware.isLoggedIn, commentController.downvoteComment);

module.exports = router;
