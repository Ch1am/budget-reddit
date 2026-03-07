const express = require("express");
const router = express.Router();

const user = {
    username: "frugalfrank",
    avatar: "https://i.pravatar.cc/150?img=12"
};



router.get("/", (req, res) => {
    res.render("settings", {
        user
    })
})

module.exports = router;