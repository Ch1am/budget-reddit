const express = require("express");
const router = express.Router();

const users = [
    { name: "Alice", email: "alice@gmail.com", password: "alice123" },
    { name: "Bob", email: "bob@gmail.com", password: "bob123" },
    { name: "Charlie", email: "charlie@gmail.com", password: "charlie123" }
];

router.get("/", (req, res) => {
    filledemail = req.query.email || null
    filledpassword = req.query.password || null
    res.render("login", {filledemail, filledpassword, emailerrormessage:null, passworderrormessage:null })
})

router.post("/login", (req, res) => {
    filledemail = req.body.email || null
    filledpassword = req.body.password || null
    emailerrormessage = null
    passworderrormessage = null
    let user = users.find(u => u.email === filledemail);
    if (!filledemail){
        emailerrormessage = "Email is required."
    }
    else if (!user) {
        emailerrormessage = "Couldn't find your account.";
    }
    if (!filledpassword){
        passworderrormessage = "Password is required."
    }
    else if (user && user.password !== filledpassword) {
        passworderrormessage = "Wrong password.";
    }

    res.render("login", {filledemail, filledpassword, emailerrormessage, passworderrormessage})
})

router.get('/register', (req, res) => {
    let newemail = null
    let name = null
    let newpassword = null
    let confirmpassword = null
    let nameerrormsg = null
    let newemailerrormsg = null
    let confirmpasswordmsg = null
    let newpassworderrormsg = null
    let emailusedmsg = null
    let passwordmatchmsg = null
    res.render('register',{newemailerrormsg,newpassworderrormsg,emailusedmsg,passwordmatchmsg,newemail,name,nameerrormsg,confirmpasswordmsg,newpassword,confirmpassword});
});

router.post("/register", (req, res) => {
    let newemail = req.body.regisemail
    let newpassword = req.body.regispassword
    let confirmpassword = req.body.regisconfirmpassword
    let name = req.body.regisname
    let nameerrormsg = null
    let newemailerrormsg = null
    let newpassworderrormsg = null
    let confirmpasswordmsg = null
    let emailusedmsg = null
    let passwordmatchmsg = null
    let user = users.find(u => u.email === newemail);
    if (!name) {
        nameerrormsg = 'Name is required.'
    }
    if (!newemail) {
        newemailerrormsg = 'Email is required.'
    }
    if (!newpassword) {
        newpassworderrormsg = 'Password is required.'
    } 
    if (!confirmpassword && newpassword) {
        confirmpasswordmsg = 'Please confirm your password.'
    }
    if (newpassword && confirmpassword && newpassword !== confirmpassword) {
        passwordmatchmsg = 'The passwords do not match. Please try again.'
    }
    if (user) {
        emailusedmsg = 'This email address has been used to register an account before.'
    } 
    
    res.render("register",{newemailerrormsg,newpassworderrormsg,emailusedmsg,passwordmatchmsg,newemail,name,nameerrormsg,confirmpasswordmsg,newpassword,confirmpassword})
})

module.exports = router;