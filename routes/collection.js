const express = require("express");
const router = express.Router();

const collectionController = require("../controllers/collectionController");

// Collections list
router.get("/my-collection", collectionController.showCollections);

// Create collection
router.get("/new-collection", collectionController.showAddCollection);
router.post("/new-collection", collectionController.addCollection);

// View individual collection by title
router.get("/collection/:title", collectionController.displayPostInCollection);

// Rename/delete collection
router.post("/rename-collection", collectionController.renameCollection);
router.post("/delete-collection", collectionController.deleteCollection);
router.get("/collection/:id/rename", collectionController.showRenameCollection);

// Remove a post from a collection
router.post("/collection/:title/remove-post", collectionController.removePostsFromCollection);

module.exports = router;

