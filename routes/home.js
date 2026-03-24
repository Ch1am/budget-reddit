const express = require("express");
const router = express.Router();
const homeController = require('../controllers/homeController')
const middleware = require("../middleware/auth");

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

// show all collection
router.get('/my-collection',homeController.showCollections)

// creating a collection
router.get ('/new-collection',homeController.showAddCollection)
router.post ('/new-collection',homeController.addCollection)

// seeing each individual collection
router.get('/collection/:title',homeController.displayPostInCollection)

router.post("/rename-collection", homeController.renameCollection)
router.post("/delete-collection", homeController.deleteCollection)
router.post("/collection/:title/remove-post", homeController.removePostsFromCollection)
router.get("/collection/:id/rename", homeController.showRenameCollection)
router.post("/rename-collection", homeController.renameCollection)
module.exports = router;