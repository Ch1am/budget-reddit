const User = require('./../models/registerModel');
const bcrypt = require("bcrypt");

exports.showLogin = async (req, res) => {
    try {
        res.render("auth/login", {
            error: [],
            filledEmail: null,
            filledPassword: null
        })
    } catch (error) {
        console.log(error)
    }
}

exports.loginAction = async (req, res) => {
    try {
        const filledEmail = req.body.email || null
        const filledPassword = req.body.password || null
        const error = []

        if (!filledEmail) {
            error.push("Email is required.")
        }

        if (!filledPassword) {
            error.push("Password is required.")
        }

        if (error.length == 0) {
            let userInfo = await User.findByEmail(filledEmail);

            if (!userInfo) {
                error.push("Couldn't find your account.")
            } else if (!await bcrypt.compare(filledPassword, userInfo.password)) {
                error.push("Incorrect credentials.")
            }

            if (error.length == 0) {
                req.session.user = userInfo._id.toString()
                res.redirect("/home")
            } else {
                res.render("auth/login", {
                    error,
                    filledEmail,
                    filledPassword
                })
            }
        } else {
            res.render("auth/login", {
                error,
                filledEmail,
                filledPassword: null
            })
        }
    } catch (error) {
        console.log(error)
    }
}

exports.showRegister = async (req, res) => {
    return res.render('auth/register', {
        error: [],
        newName: undefined,
        newEmail: undefined,
        newPassword: undefined,
        confirmPassword: undefined
    });
}

exports.register = async (req, res) => {
    try {
        const error = []
        const newEmail = req.body.regisemail
        const newPassword = req.body.regispassword
        const confirmPassword = req.body.regisconfirmpassword
        const newName = req.body.regisname
        const existing = newEmail ? await User.findByEmail(newEmail) : null

        if (!newName) error.push("Name is required.");
        if (!newEmail) error.push("Email is required.");
        if (!newPassword) {
            error.push("Password is required.");
        } else {
            if (newPassword.length < 8) error.push("Password must be at least 8 characters in length.");
            if (!/[A-Z]/.test(newPassword)) error.push("Password must contain at least one uppercase letter.");
            if (!/[a-z]/.test(newPassword)) error.push("Password must contain at least one lowercase letter.");
            if (!/[0-9]/.test(newPassword)) error.push("Password must contain at least one number.");
            if (!/[^A-Za-z0-9]/.test(newPassword)) error.push("Password must contain at least one special character.");
        }

        if (!confirmPassword) error.push("Password confirmation is required.");
        if (!confirmPassword && newPassword) error.push("Please confirm your password.");
        if (newPassword && confirmPassword && newPassword !== confirmPassword && newPassword.length >= 8) error.push("The passwords do not match. Please try again.");
        if (newEmail && newPassword && confirmPassword && existing && newPassword == confirmPassword) error.push("This email address has already been used to register an account before.");

        if (error.length >= 1) {
            res.render("auth/register", {
                error,
                newEmail,
                newPassword,
                confirmPassword,
                newName
            })
        } else {
            const result = await User.addUser({
                name: newName,
                email: newEmail,
                password: await bcrypt.hash(newPassword, 10),
                type: "user",
                communities: []
            })

            if (!result) {
                res.send("There was an error when creating your account.")
            } else {
                res.send(`
                    Your account has been created. Welcome to MemeIt, ${result.name}!<br><br>
                    You will be redirected to the login page in 3 seconds...
                    <script>
                        setTimeout(() => {
                            window.location.href = "/login";
                        }, 3000);
                    </script>
                `);
            }
        }
    } catch (error) {
        console.log(error)
    }
}

exports.password = async (req, res) => {
    try {
        email = null
        newpassword = null
        confirmpassword = null
        emailerrormessage = null
        passworderrormessage = null
        confirmpasserrormessage = null
        html = null
        res.render("forgot", { email, newpassword, confirmpassword, emailerrormessage, passworderrormessage, confirmpasserrormessage, html })
    } catch (error) {
        console.log(error)
    }
}
exports.changePassword = async (req, res) => {
    email = req.body.email
    newpassword = req.body.newpassword
    confirmpassword = req.body.confirmnewpass
    emailerrormessage = null
    passworderrormessage = null
    confirmpasserrormessage = null
    html = null

    if (!email) {
        emailerrormessage = "Email is required"
    }
    if (!newpassword) {
        passworderrormessage = "New Password is required"
    }
    if (newpassword && !confirmpassword) {
        confirmpasserrormessage = "Please confirm your new password"
    }

    if (!emailerrormessage) {
        userInfo = await User.findByEmail(email);
        if (!userInfo)
            emailerrormessage = "Couldn't find your account"
    }
    if (!passworderrormessage && !confirmpasserrormessage && newpassword !== confirmpassword) {
        confirmpasserrormessage = "Passwords do not match"
    }
    if (!emailerrormessage && !passworderrormessage && !confirmpasserrormessage) {
        await User.editUser(email, newpassword);
        html = `Password has been changed`
    }
    return res.render("forgot", { email, newpassword, confirmpassword, emailerrormessage, passworderrormessage, confirmpasserrormessage, html })

}
// const filePath = "password-data.json";
// exports.getUser = async (req, res)=>{
//     let email = read.query.email
//     console.log(email)
//     try {
//         let userInfo = await UserActivation.findByemail(email)
//         console.log(userInfo)
//         res.render("login", {userInfo})
//     }catch (error) {
//         console.log(error)
//         return []
//     }
// }

// exports.readUser = async(req, res) => {
//     try {
//         //read file
//         const raw = await fs.readFile (filePath, 'utf-8')
//         return JSON.parse(raw || '[]') // return the data(user:password) in js object style
//     } catch (error) {
//         console.log(error)
//         return []
//     }
// }

// } // file read so def async method

// exports.addUser = async (users) => {
//     try {
//         let ogcontent = []
//         const raw = await fs.readFile (filePath,'utf-8')
//         if (raw) {
//             ogcontent = JSON.parse(raw) // add the raw in to safe it before you overwrite
//         }
//          ogcontent.push(users)
//          const jsonData = JSON.stringify (ogcontent,null,2) //convert js array into json
//          await fs.writeFile(filePath,jsonData) //adding info inside
//     } catch (error) {
//         console.error ('Error saving password:',error)
//     }
// }

// exports.register = async(req, res)=>{
// try {
//         let newemail = req.body.regisemail
//         let newpassword = req.body.regispassword
//         let confirmpassword = req.body.regisconfirmpassword
//         let name = req.body.regisname
//         let nameerrormsg = null
//         let newemailerrormsg = null
//         let newpassworderrormsg = null
//         let confirmpasswordmsg = null
//         let emailusedmsg = null
//         let passwordmatchmsg = null
//         let html = null
//         // let users = await passwordController.readUser() // users is a list
//         // dont forget readUser() needs await if not .find() cannot work coz no users
//         // let user = users.find(u => u.email === newemail);
//         if (!name) {
//             nameerrormsg = 'Name is required.'
//         }
//         if (!newemail) {
//             newemailerrormsg = 'Email is required.'
//         }
//         if (!newpassword) {
//             newpassworderrormsg = 'Password is required.'
//         }
//         if (!confirmpassword && newpassword) {
//             confirmpasswordmsg = 'Please confirm your password.'
//         }
//         if (newpassword && confirmpassword && newpassword !== confirmpassword) {
//             passwordmatchmsg = 'The passwords do not match. Please try again.'
//         }
//         const existing = newemail ? await User.findByemail(newemail) : null
//         if (existing){
//             emailusedmsg = "This email address has been used to register an account before."
//         }
//         if (!nameerrormsg && !newemailerrormsg && !newpassworderrormsg && !confirmpasswordmsg && !passwordmatchmsg && !emailusedmsg) {
//         await User.addUser({ name, email: newemail, password: newpassword });
//         html = `Welcome ${name}!`;
//         }

//         // if (userInfo) {
//         //     emailusedmsg = 'This email address has been used to register an account before.'
//         // }


//         // if (!nameerrormsg && !newemailerrormsg && !newpassworderrormsg && !confirmpasswordmsg && !passwordmatchmsg && !emailusedmsg) {
//         //     users.push({name:name,email:newemail,password:newpassword})
//         //     passwordController.addUser(users) // will overwrite the og file
//         //     html=`Welcome ${name}!`
//         // }

//         return res.render("register",{newemailerrormsg,newpassworderrormsg,emailusedmsg,passwordmatchmsg,newemail,name,nameerrormsg,confirmpasswordmsg,newpassword,confirmpassword,html})
//     } catch(error) {
//         console.log(error)
//     }
// }