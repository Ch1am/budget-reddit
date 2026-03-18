const express = require("express");
const router = express.Router();
const passwordController = require("../controllers/passwordController")

// login page
router.get("/", passwordController.showLogin)
router.get("/login", passwordController.showLogin)
router.post("/login", passwordController.loginAction)

// register page
router.get("/register", passwordController.showRegister)
router.post("/register", passwordController.register)
router.get("/forgot", passwordController.password)
router.post("/forgot", passwordController.changePassword)

module.exports = router;