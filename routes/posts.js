const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');
const upload = multer({storage:multer.memoryStorage()})

//GET for post creation view
router.get('/create', postController.getCreatePost);

// POST create form
router.post('/create', upload.single('image'),postController.createPost);

//GET to see single post
router.get('/:id', postController.getSinglePost);


module.exports = router;