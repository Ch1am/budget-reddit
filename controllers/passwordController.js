const User = require('./../models/registerModel');
const bcrypt = require("bcryptjs");
const collectionModel = require('./../models/collectionModel');

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
            let userInfo = await User.findByEmail(filledEmail.toLowerCase());

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
        const usernameTaken = await User.findByUsername(newName)

        if (!newName) error.push("Name is required.");
        if (newName.trim().length == 0) {
            error.push('Please enter a valid name.')
        }
        if (newName.length < 3) {
            error.push("Username must have at least 3 characters.")
        } else if (newName.length > 50) {
            error.push("Username cannot have more than 50 characters.")
        } else if (usernameTaken) {
            error.push(`The username ${newName} is too popular right now. Please try other usernames`)
        }
        if (!newEmail) error.push("Email is required.");
        if(newEmail && !newEmail.includes(".com"))
            error.push("Enter a proper email domain");
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
                email: newEmail.toLowerCase(),
                password: await bcrypt.hash(newPassword, 10),
                type: "user",
                communities: []
            })

            if (!result) {
                res.send("There was an error when creating your account.")
            } else {
                //creating default collection once acc is created
                const defaultCollection = {
                    title: 'Favourite',
                    user: result._id,
                    posts:[]
                }
                await collectionModel.createCollection(defaultCollection)

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
        error = []
        html = null
        res.render("auth/forgot", { email, newpassword, confirmpassword, error, html })
    } catch (error) {
        console.log(error)
    }
}
exports.changePassword = async (req, res) => {
    try {
        let email = req.body.email
        let newpassword = req.body.newpassword
        let confirmpassword = req.body.confirmpassword
        let error = []
        let html = null
        let userInfo = await User.findByEmail(email.toLowerCase());

        if (!email) {
            error.push("Email is required")
        }
        if(email && !email.includes(".com"))
            error.push("Enter a proper email domain")
        if (!userInfo) {
            error.push("Couldn't find your account")
        }
        if (!newpassword && userInfo) {
            error.push("New Password is required")
        
        
        } else if (newpassword && userInfo) {
            if (newpassword.length < 8) error.push("Password must be at least 8 characters in length.");
            if (!/[A-Z]/.test(newpassword)) error.push("Password must contain at least one uppercase letter.");
            if (!/[a-z]/.test(newpassword)) error.push("Password must contain at least one lowercase letter.");
            if (!/[0-9]/.test(newpassword)) error.push("Password must contain at least one number.");
            if (!/[^A-Za-z0-9]/.test(newpassword)) error.push("Password must contain at least one special character.");
        }
        if (!confirmpassword && newpassword && userInfo) error.push("Please confirm your password.");
        if (newpassword && confirmpassword && newpassword !== confirmpassword && newpassword.length >= 8 && userInfo) error.push("The passwords do not match. Please try again.")
        if (userInfo && newpassword && confirmpassword && newpassword == confirmpassword && error.length == 0){
            let passwordCompare = await bcrypt.compare(newpassword, userInfo.password)
            if (passwordCompare) {
                error.push("The current password and the new password cannot be the same!")
            } else {
                let changedpassword = await bcrypt.hash(newpassword, 10)
                await User.editUser(email.toLowerCase(), userInfo.name, changedpassword, userInfo.type);
                console.log('Password has been changed')
                return res.send(`
                        Your password has been changed. Welcome back to MemeIt, ${userInfo.name}!<br><br>
                        You will be redirected to the login page in 3 seconds...
                        <script>
                            setTimeout(() => {
                                window.location.href = "/login";
                            }, 3000);
                        </script>
                    `)
            }
        }
        return res.render("auth/forgot", { email, newpassword, confirmpassword, error, html })
    } catch(err) {
        console.log(err)
    }
    
    

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