const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const middleware = require("../middleware/auth");

// main page
router.get("/", middleware.isLoggedIn, communityController.communityLanding);

// community creation
router.get("/create", middleware.isLoggedIn, communityController.renderCreateCommunity);
router.post("/create", middleware.isLoggedIn, communityController.createCommunity);

// render community
router.get("/:communityID", middleware.isLoggedIn, communityController.renderCommunity);

// main functions
router.post("/:communityID/join", middleware.isLoggedIn, communityController.joinCommunity);
router.post("/:communityID/leave", middleware.isLoggedIn, communityController.leaveCommunity);
router.post("/:communityID/manage", middleware.isLoggedIn, communityController.renderManageCommunity);
router.get("/:communityID/manage", middleware.isLoggedIn, communityController.renderManageCommunity);

// admin fucntions
router.post("/:communityID/manage/removeAdmin", middleware.isLoggedIn, communityController.removeAdmin);
router.post("/:communityID/manage/removeUser", middleware.isLoggedIn, communityController.removeUser)
router.post("/:communityID/manage/makeAdmin", middleware.isLoggedIn, communityController.addAdmin);
router.post("/:communityID/manage/deleteCommunity", middleware.isLoggedIn, communityController.deleteCommunityRenderConfirmation);
router.post("/:communityID/manage/delete", middleware.isLoggedIn, communityController.deleteCommunity);
router.post("/:communityID/manage/deletePost", middleware.isLoggedIn, communityController.deletePost);
router.post("/:communityID/manage/save", middleware.isLoggedIn, communityController.saveChanges);

module.exports = router;
