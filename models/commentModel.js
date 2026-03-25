const mongoose = require("mongoose");
const Post = require("./postModel");

const voterSchema = new mongoose.Schema({
    username: { type: String, required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
}, { _id: false });

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    image: {
        data: { type: Buffer, default: null },
        contentType: { type: String, default: null },
    },
    content: { type: String, required: false, default: "" },
    votes: { type: Number, default: 0 },
    voters: [voterSchema],
});

const Comment = mongoose.model("Comment", commentSchema, "comment");

//Function getAllcomment retrieves all data
exports.getCommentsByPost = async (postId) => {
    return await Comment.find({ postId }).lean();
};

exports.getCommentById = async (id) => {
  return await Comment.findById(id).lean();
};

//function getPostsByAuthor retrieves all posts made by user who is logged in.
exports.getCommentByAuthor = async (author) => {
    return await Comment.find({ author }).lean();
};

//Function createPost to create a new post and insert into mongo
exports.createComment = async (postId, commentData) => {
    const comment = new Comment({ ...commentData, postId });
    await comment.save();

    // Keep commentCount in sync on the Post
    // Use the helper exposed by `postModel` (not the Mongoose model directly).
    // Otherwise we hit `findByIdAndUpdate is not a function` because `Post`
    // here is the imported module, not the raw mongoose model.
    await Post.incrementCommentCount(postId, 1);

    return comment;
};

// update vote count and voters list
exports.updateCommentVote = async (id, username, voteType, voteChange) => {
    const comment = await Comment.findById(id);
    if (!comment) return;

    // Older documents may not have `voters` populated; normalize to an array.
    const currentVoters = comment.voters || [];

    // remove existing vote if any
    comment.voters = currentVoters.filter((v) => v.username !== username);
    // add new vote if not removing
    if (voteType !== null) {
        comment.voters.push({ username, voteType });
    }
    // update vote count
    comment.votes = (comment.votes || 0) + voteChange;

    // save back to MongoDB
    await comment.save();
};

//editing logged in user post
exports.editComment = async (id, updatedData) => {
    return await Comment.findByIdAndUpdate(id, updatedData);
};

//deleting logged in user post
exports.deleteComment = async (id, postId) => {
    await Comment.findByIdAndDelete(id);
    // Keep commentCount in sync when deleting comments.
    await Post.incrementCommentCount(postId, -1);
};

