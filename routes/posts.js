const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');
const upload = multer({storage:multer.memoryStorage()})
const middleware = require("../middleware/auth");

//GET for post creation view
router.get('/create', middleware.isLoggedIn, postController.getCreatePost);

// POST create form
router.post('/create', middleware.isLoggedIn, upload.single('image'), postController.createPost);

//GET to see single post
router.get('/:id', middleware.isLoggedIn, postController.getSinglePost);


module.exports = router;