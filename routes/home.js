const express = require("express");
const router = express.Router();
const homeController = require('../controllers/homeController')
const middleware = require("../middleware/auth");
// Collection routes moved to `routes/collection.js`

//GET route to display the list of posts
router.get("/", middleware.isLoggedIn, homeController.displayAllPost);

// POST upvote
router.post('/:id/upvote', middleware.isLoggedIn, homeController.upvote);

// POST downvote
router.post('/:id/downvote', middleware.isLoggedIn, homeController.downvote);

// POST share (stub)
router.post('/:id/share', (req, res) => {
	res.redirect('/home');
});

module.exports = router;