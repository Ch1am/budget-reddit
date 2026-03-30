const express = require("express");
const router = express.Router();

const collectionController = require("../controllers/collectionController");
const middleware = require("../middleware/auth");

// Collections list
router.get("/my-collection", middleware.isLoggedIn, collectionController.showCollections);

// Create collection
router.get("/new-collection", middleware.isLoggedIn, collectionController.showAddCollection);
router.post("/new-collection", middleware.isLoggedIn, collectionController.addCollection);

// View individual collection by title
router.get("/collection/:title", middleware.isLoggedIn, collectionController.displayPostInCollection);

// Rename/delete collection
router.post("/rename-collection", middleware.isLoggedIn, collectionController.renameCollection);
router.post("/delete-collection", middleware.isLoggedIn, collectionController.deleteCollection);
router.get("/collection/:id/rename", middleware.isLoggedIn, collectionController.showRenameCollection);

// Remove a post from a collection
router.post(
  "/collection/:title/remove-post",
  middleware.isLoggedIn,
  collectionController.removePostsFromCollection,
);

module.exports = router;

