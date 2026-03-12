const express = require("express");
const router = express.Router();

let user = {
    username: "frugalfrank",
    avatar: "https://i.pravatar.cc/150?img=12"
};


router.get("/", (req, res) => {
    res.render("settings", {
        user, 
        response: undefined,
        acc_delete: undefined,
        username_change: undefined
    })
})


router.post("/", (req, res) => {
    const currentPassword = req.body.currentPassword
    const newPassword = req.body.newPassword
    const confirmPassword = req.body.confirmPassword

    let response = {}

    if (newPassword != confirmPassword) {
        response.r = "The new passwords do not match!"
        response.d = undefined
    } else if (newPassword == currentPassword) {
        response.r = "The new password cannot be the same as the old password!"
        response.d = undefined
    } else if (newPassword.length < 8 || newPassword.length > 50)  {
        response.r = "The length of the password should be between 8 and 50 characters long!"
        response.d = undefined
    } else {
        response.r = "Success!"
        response.d = newPassword
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        response = undefined
    }

    res.render("settings", {
        user,
        response,
        acc_delete: undefined,
        username_change: undefined
    })
})

router.post("/delete", (req, res) => {
    const confirmation = req.body.confirm_delete
    const confirmUsername = req.body.confirmUsername

    if (confirmation == "pressed") {
        let r = undefined
        if (confirmUsername.length == 0) {
            
            r = "Please enter your username to confirm deletion"

            res.render("settings", {
                user,
                response: undefined,
                acc_delete: {
                    status: false,
                    msg: r
                },
                username_change: undefined
            })
        } else {
            res.redirect("/home")
        }
    } else {
        res.render("settings", {
            user,
            response: undefined,
            acc_delete: {
                status: true,
                msg: undefined
            },
            username_change: undefined
        })
    }
})

router.post("/username", (req, res) => {
    let status = {
        changed: false,
        reason: undefined,
        name: undefined
    }

    const data = req.body.username

    if (!data) {
        status.reason = "No new username provided"
    } else {
        status.changed = true,
        status.reason = undefined
        status.name = data

        user.username = data
    }

    res.render("settings", {
        user,
        response: undefined,
        acc_delete: {
            status: true,
            msg: undefined
        },
        username_change: status
    })
})
module.exports = router;