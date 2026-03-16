const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')

//GET to see single post
router.get('/:id', postController.getSinglePost);

//GET for post creation view
router.get('/create', (req, res) => {
  res.render('post-create');
});

// POST create form
router.post('/create', postController.createPost);

module.exports = router;