const express = require("express");
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');
const collectionController = require("../controllers/collectionController");
const upload = multer({storage:multer.memoryStorage()})
const middleware = require("../middleware/auth");

//GET for post creation view
router.get('/create', middleware.isLoggedIn, postController.getCreatePost);

// POST create form
router.post('/create', middleware.isLoggedIn, upload.single('image'), postController.createPost);

// add to collection
router.get('/:id/add-to-collection', collectionController.showCollectionDetails);
router.post('/:id/add-to-collection', collectionController.addInCollection);

//GET to see all user post
router.get("/myposts", postController.getUserPost);

//GET to retrieve edit post ejs
router.get("/:id/edit", postController.getEditPost);

//POST to send edited post
router.post("/:id/edit", postController.editPost);

//POST to handle delete
router.post("/:id/delete", postController.deletePost);

//GET to see single post
router.get('/:id', middleware.isLoggedIn, postController.getSinglePost);

module.exports = router;
