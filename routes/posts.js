const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')

//GET for post creation view
router.get('/create', (req, res) => {
  res.render('post-create');
});

// POST create form
router.post('/create', postController.createPost);

module.exports = router;