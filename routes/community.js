const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");

// main page
router.get("/", communityController.communityLanding);

router.get("/create", communityController.renderCreateCommunity);
router.post("/create", communityController.createCommunity);

router.get("/:communityID", communityController.renderCommunity)



module.exports = router;
