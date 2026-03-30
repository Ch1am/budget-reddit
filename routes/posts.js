const express = require("express");
const router = express.Router();
const postController = require('../controllers/postController');
const collectionController = require("../controllers/collectionController");
const middleware = require("../middleware/auth");
const postAuth = require("../middleware/postAuth");
//GET for post creation view
router.get('/create', middleware.isLoggedIn, postController.getCreatePost);

// POST create form
router.post('/create', postController.createPost);

// add to collection
router.get('/:id/add-to-collection', middleware.isLoggedIn, collectionController.showCollectionDetails);
router.post('/:id/add-to-collection', middleware.isLoggedIn, collectionController.addInCollection);

//GET to see all user post
router.get("/myposts", middleware.isLoggedIn, postController.getUserPost);

//GET to retrieve edit post ejs
router.get("/:id/edit", middleware.isLoggedIn, postAuth.isPostOwnerOrAdmin, postController.getEditPost);

//POST to send edited post
router.post("/:id/edit", middleware.isLoggedIn,postAuth.isPostOwnerOrAdmin, postController.editPost);

//POST to handle delete
router.post("/:id/delete", middleware.isLoggedIn, postAuth.isPostOwnerOrAdmin, postController.deletePost);

//GET to see single post
router.get('/:id', middleware.isLoggedIn, postController.getSinglePost);

module.exports = router;
