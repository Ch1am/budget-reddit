const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const auth = require("../middleware/auth");

router.get("/", auth.isLoggedIn, settingsController.renderSettingsPage);
router.post("/", auth.isLoggedIn, settingsController.renderSettingsPage);
router.post("/username", auth.isLoggedIn, settingsController.changeUsername);
router.post("/password", auth.isLoggedIn, settingsController.changePassword)
router.post("/logout", auth.isLoggedIn, settingsController.logout);
router.post("/delete", auth.isLoggedIn, settingsController.renderDeleteAccount);
router.post("/confirmDelete", auth.isLoggedIn, settingsController.deleteAccountAction);

module.exports = router;