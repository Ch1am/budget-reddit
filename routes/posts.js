const express = require("express");
const router = express.Router();
const multer = require("multer");
const postController = require("../controllers/postController");
const upload = multer({ storage: multer.memoryStorage() });

//GET for post creation view
router.get("/create", postController.getCreatePost);

// POST create form
router.post("/create", upload.single("image"), postController.createPost);

//GET to see all user post
router.get("/myposts", postController.getUserPost);

//GET to retrieve edit post ejs
router.get("/:id/edit", postController.getEditPost);

//POST to send edited post
router.post("/:id/edit", postController.editPost);

//POST to handle delete
router.post("/:id/delete", postController.deletePost);

//GET to see single post
router.get("/:id", postController.getSinglePost);

module.exports = router;
