const express = require("express");
const router = express.Router();
const passwordController = require("../controllers/passwordController")
const auth = require("../middleware/auth");

// login page
router.get("/", auth.redirectIfLoggedIn, passwordController.showLogin)
router.get("/login", auth.redirectIfLoggedIn, passwordController.showLogin)
router.post("/login", passwordController.loginAction)

// register page
router.get("/register", auth.redirectIfLoggedIn, passwordController.showRegister)
router.post("/register", passwordController.register)
router.get("/forgot", passwordController.password)
router.post("/forgot", passwordController.changePassword)

module.exports = router;