const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/post/:postId/comment", upload.single("image"), commentController.createComment);
router.post("/comment/:id/edit", upload.single("image"), commentController.editComment);
router.post("/comment/:id/delete", commentController.deleteComment);
router.post("/comment/:id/upvote", commentController.upvoteComment);
router.post("/comment/:id/downvote", commentController.downvoteComment);

module.exports = router;
