const Post = require("../models/postModel");
const Community = require("../models/communityModel");
const User = require("../models/registerModel");

exports.isLoggedIn = (req, res, next) => {
    const session = req.session
    if (!session || !session.user) {
        console.log("The user is not currently logged in. Redirecting to login page...")
        return res.redirect("/login");
    }
    next();
}
