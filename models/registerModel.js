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
    },
    communities: {
        type: Array,
        default: []
    }
})

const User = mongoose.model("User", accountSchema, "users")

exports.findByEmail = function(email) {
    return User.findOne({
        email: email
    })
}

exports.addUserToCommunityUserSide = function(communityID, userID) {
    return User.findByIdAndUpdate(
        userID,
        // pushes the user to the community but only if the user doesn't already exist
        { $addToSet: { communities: communityID }},
        { returnDocument: 'after' }
    )
}

exports.removeUserFromCommunityUserSide = function(communityID, userID) {
    return User.findByIdAndUpdate(
        userID,
        // pulls the user from the users array of a specific community
        { $pull: { communities: communityID }},
        { returnDocument: 'after' }
    )
}

exports.findByUserID = function(id) {
    return User.findById(id);
}

// Bulk lookup for rendering authors/voters efficiently.
exports.findUsersByIds = function(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve([]);
    return User.find({ _id: { $in: ids } });
}

exports.findByUsername = function(name) {
    return User.findOne({ name: name })
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

exports.editUserName = function(id, name) {
    return User.findByIdAndUpdate(id, 
        { name: name },
        { new: true, runValidators: true}
    );
}

exports.editPassword = function(id, hashedPassword) {
    return User.findByIdAndUpdate(id, 
        { password: hashedPassword},
        { new: true, runValidators: true}
    )
}

exports.deleteAccount = function(id) {
    return User.findByIdAndDelete(id);
}