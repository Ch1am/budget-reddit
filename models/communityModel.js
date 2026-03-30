const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A community must have a name"]
    },
    description: {
        type: String,
        required: [true, "A community must have a name"]
    },
    users: {
        type: Array, 
        required: [true, "A community must have at least one user. Use user IDs"],
        unique: true
    },
    admins: {
        type: Array, 
        required: [true, "A community must have at least one admin"]
    },
    posts: {
        type: Array,
        default: []
    }
})

const Community = mongoose.model("Community", communitySchema, "community")

// community functions
exports.createCommunity = function(community) {
    return Community.create(community);
}

exports.findCommunityById = function(communityID) {
    return Community.findById(communityID);
}

exports.findCommunityByName = function(communityName) {
    return Community.findOne(

        // ^ and $ ensures full exact match, the i is for case insensitive
        {name: RegExp('^' + communityName + '$', 'i')}
    )
}


exports.deleteCommunityById = function(communityID) {
    return Community.findByIdAndDelete(communityID);
} 

exports.getAllCommunities = function() {
    return Community.find();
}

// user in community function
exports.addUserToCommunity = function(communityID, userID) {
    return Community.findByIdAndUpdate(
        communityID,
        // pushes the user to the community but only if the user doesn't already exist
        { $addToSet: { users: userID }},
        { returnDocument: 'after' }
    )
}

exports.findUserInCommunity = function(communityID, userID) {
    return Community.findOne({
        _id: communityID,
        users: userID
    })
}

exports.removeUserFromCommunity = function(communityID, userID) {
    return Community.findByIdAndUpdate(
        communityID,
        // pulls the user from the users array of a specific community
        { $pull: { 
            users: userID,
            admins: userID
        }},
        { returnDocument: 'after' }
    )
}

// admin in community function
exports.addAdminToCommunity = function(communityID, userID) {
    return Community.findOneAndUpdate(
        { _id: communityID, users: userID },
        { $addToSet: { admins: userID } }, 
        { returnDocument: 'after' }
    )
}

exports.removeAdminFromCommunity = function(communityID, userID) {
    return Community.findOneAndUpdate(
        { _id: communityID, users: userID, admins: userID },
        { $pull: { admins: userID } },
        { returnDocument: 'after' }
    )
}

exports.findAdminInCommunity = function(communityID, userID) {
    return Community.findOne({
        _id: communityID,
        users: userID,
        admins: userID
    })
}

// posts in community function
exports.addPostToCommunity = function(communityID, userID, postID) {
    return Community.findOneAndUpdate(
        { _id: communityID, users: userID },
        { $addToSet: { posts: postID } },
        { returnDocument: 'after' }
    )
}

exports.viewPostFromCommunity = function(communityID, postID) {
    return Community.findOne({
        _id: communityID,
        posts: postID
    })
}

exports.deletePostFromCommunity = function(communityID, postID) {
    return Community.findOneAndUpdate(
        { _id: communityID, posts: postID},
        { $pull: { posts: postID } },
        { returnDocument: 'after'} 
    )
}

// community description
exports.editCommunityDescription = function(communityID, userID, desc) {
    return Community.findOneAndUpdate(
        { _id: communityID, users: userID, admins: userID},
        { $set: { description: desc } },
        { returnDocument: 'after' }
    )
}

// community name
exports.editCommunityName = function(communityID, userID, name) {
    return Community.findOneAndUpdate(
        { _id: communityID, users: userID, admins: userID},
        { $set: { name: name } },
        { returnDocument: 'after' }
    )
}