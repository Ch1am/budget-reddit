const User = require("../models/registerModel");
const bcrypt = require("bcrypt");
const Community = require("../models/communityModel");
const collection = require("../models/collectionModel");

exports.renderSettingsPage = async(req, res) => {
    const user = await User.findByUserID(req.session.user);

    res.render("settings/settings", {
        user, 
        accountDelete: false,
        usernameErrors: [],
        passwordErrors: [],
        tempUsername: null
    });
}

exports.changeUsername = async(req, res) => {
    const session = req.session.user
    const user = await User.findByUserID(session);
    const newUsername = req.body.newUsername.trim();
    const errors = []
    const usernameTaken = await User.findByUsername(newUsername);

    if (newUsername.length < 3) {
        errors.push("Username must have at least 3 characters.")
    } else if (newUsername.length > 50) {
        errors.push("Username cannot have more than 50 characters.")
    } else if (user.name == newUsername) {
        errors.push("Your new username shouldn't be the same as your old one.")
    } else if (usernameTaken) {
        errors.push(`The username ${newUsername} is too popular right now. Please try other usernames...`)
    }


    if (errors.length > 0) {
        res.render("settings/settings", {
            user, 
            accountDelete: false,
            usernameErrors: errors,
            passwordErrors: [],
            tempUsername: newUsername
        })
    } else {
        const result = await User.editUserName(session, newUsername);

        if (result) {
            return res.send(`
                You have successfully changed your username to <strong>${result.name}</strong>. You will be redirected back to the settings page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/settings";
                    }, 3000);
                </script>
            `)
        } else {
            return res.send("An error has occured when editing your username. Please try again later...")
        }
    }
}

exports.changePassword = async (req, res) => {
    const currentPassword = req.body.currentPassword
    const newPassword = req.body.newPassword
    const confirmPassword = req.body.confirmPassword

    const session = req.session.user
    const user = await User.findByUserID(session);
    const passwordCompare = await bcrypt.compare(currentPassword, user.password);
    const errors = []

    if (passwordCompare) {
        if (currentPassword === newPassword) {
            errors.push("The current password and the new password cannot be the same!")
        }
        
        if (newPassword.length < 8) errors.push("Password must be at least 8 characters in length.");
        if (!/[A-Z]/.test(newPassword)) errors.push("Password must contain at least one uppercase letter.");
        if (!/[a-z]/.test(newPassword)) errors.push("Password must contain at least one lowercase letter.");
        if (!/[0-9]/.test(newPassword)) errors.push("Password must contain at least one number.");
        if (!/[^A-Za-z0-9]/.test(newPassword)) errors.push("Password must contain at least one special character.");

        if (newPassword !== confirmPassword) {
            errors.push("The new password and the confirmation password do not match. Please try again")
        }

        

        if (errors.length > 0) {
            res.render("settings/settings", {
                user, 
                accountDelete: false,
                usernameErrors: [],
                passwordErrors: errors,
                tempUsername: null
            })
        } else {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await User.editPassword(session, hashedPassword);

            if (result) {
                return res.send(`
                    You have successfully changed your password! You will be redirected back to the settings page in 3 seconds...
                    <script>
                        setTimeout(() => {
                            window.location.href = "/settings";
                        }, 3000);
                    </script>
                `)
            } else {
                return res.send("An error has occured when changing your password. Please try again later...")
            }
        }
    } else {
        errors.push("The current password provided is incorrect. Please try again.")

        res.render("settings/settings", {
            user, 
            accountDelete: false,
            usernameErrors: [],
            passwordErrors: errors,
            tempUsername: null
        })
    }
}

exports.renderDeleteAccount = async (req, res) => {
    const user = await User.findByUserID(req.session.user);

    res.render("settings/settings", {
        user, 
        accountDelete: true,
        usernameErrors: [],
        passwordErrors: [],
        tempUsername: null
    })
}

exports.deleteAccountAction = async (req, res) => {
    const session = req.session.user
    const user = await User.findByUserID(session);
    const confirmUsername = req.body.confirmUsername


    if (confirmUsername !== user.name || confirmUsername.length == 0) {
        console
        return res.send(`
            The confirmation username and your username <strong>do not match</strong>! Deletion cancelled. You will be redirected back to the settings page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/settings";
                }, 3000);
            </script>
        `)
    }

    if (user.communities.length > 0) {
        const communities = await Promise.all(
            user.communities.map(async c => {
                let community = await Community.findCommunityById(c)
                return community
            })
        )

        const adminChecks = await Promise.all(
            user.communities.map(c => Community.findAdminInCommunity(c, user._id))
        );

        const adminOf = adminChecks.filter(c => c !== null);

        if (adminOf.length > 0) {
            const names = adminOf.map(c => c.name).join(", ");
            return res.send(`
                You are the admin of: <strong>${names}</strong>.
                Please transfer ownership or delete those communities before deleting your account.
                <script>
                    setTimeout(() => { window.location.href = "/settings"; }, 5000);
                </script>
            `);
        }

        const r1 = await Promise.all(
            communities.map(c => {
                let r = Community.removeUserFromCommunity(c._id, session)
                return r
            })
        );

        if (!r1) {
            return res.send(`
                An error has occured when deleting your account. Please try again later...
                <script>
                    setTimeout(() => { window.location.href = "/settings"; }, 3000);
                </script>
            `);
        }
    }

    const r2 = await collection.deleteUserCollection(user._id);
    console.log(r2)
    const r3 = await User.deleteAccount(user._id);
    
    const r4 = await collection.updateMany(
        { "authorId": user._id }, 
        { $set: { "authorName": "Deleted-User", "authorId": null } }
    );

    if (r2 && r3) {
        req.session.destroy(() => {
            res.clearCookie("session");

            return res.send(`
                Your account has been successfully deleted. You will be redirected in 3 seconds.
                <script>
                    setTimeout(() => { window.location.href = "/"; }, 3000);
                </script>
            `);
        })
    }
} 

exports.logout = (req, res) => {
    req.session.destroy(e => {
        if (e) {
            console.error("An error has occured when logging out", e);
            return res.status(500).send("Could not log out.")
        }

        res.clearCookie("session");
        res.redirect("/login");
    })
}