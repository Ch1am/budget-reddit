const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "An account must have a name"]
    },
    email: {
        type: String, 
        required: [true, "An account must have an email"],
        unique: true
    },
    password: {
        type: String, 
        required: [true, "An account must have a password"]
    },
    type: {
        type: String,
        default: "user"
    }
})

const User = mongoose.model("User", accountSchema, "users")

exports.findByEmail = function(email) {
    return User.findOne({
        email: email
    })
}

exports.findByUserID = function(id) {
    return User.findById(id);
}

exports.addUser = function(newUser) {
    return User.create(newUser)
}

exports.editUser = function(email, name, password, type) {
    return User.updateOne({
        email: email
    }, {
        name: name,
        password: password,
        type: type
    })
}