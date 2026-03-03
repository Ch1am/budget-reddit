const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("potato")
})

router.get("/helloworld", (req, res) => {
    res.send("Hello")
})
module.exports = router;