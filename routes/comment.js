const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// POST create new comment
router.post("/post/:postId/comment", upload.single("image"), commentController.createComment);

// POST to update comment
router.post("/comment/:id/edit", upload.single("image"), commentController.editComment);

// POST to handle delete
router.post("/comment/:id/delete", commentController.deleteComment);

// for upvoting comment
router.post("/comment/:id/upvote", commentController.upvoteComment);

// for downvoting a comment
router.post("/comment/:id/downvote", commentController.downvoteComment);

module.exports = router;
