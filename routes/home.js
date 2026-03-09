const express = require("express");
const router = express.Router();
const homeController = require('../controllers/homeController')

//GET all post and display
router.get("/", homeController.displayAllPost)

// POST upvote
router.post('/:id/upvote', homeController .upvote);

// POST downvote
router.post('/:id/downvote', homeController.downvote);

// POST share (stub)
router.post('/:id/share', (req, res) => {
  res.redirect('/home');
});

module.exports = router;