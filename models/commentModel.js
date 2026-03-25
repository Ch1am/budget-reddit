const mongoose = require("mongoose");
const Post = require("./postModel");

const voterSchema = new mongoose.Schema({
    // Store voter as userId so votes survive username changes/deletion.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
}, { _id: false });

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    // New: store author as userId so comments can still render after account deletion.
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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

//Function getAllcomment retrieves comments data based on the postId of the post
exports.getCommentsByPost = async (postId) => {
    return await Comment.find({ postId }).lean();
};

// function getCommentById retrieves comment id for editing and deleting
exports.getCommentById = async (id) => {
  return await Comment.findById(id).lean();
};

//function getCommentByAuthor retrieves all comments made by a specific user
exports.getCommentByAuthorId = async (authorId) => {
    return await Comment.find({ authorId }).lean();
};

//Function createComment to create a new comment and insert into mongo
exports.createComment = async (postId, commentData) => {
    const comment = new Comment({ ...commentData, postId });
    await comment.save();

    // increase comment post for post when new comment is created
    await Post.incrementCommentCount(postId, 1);

    return comment;
};

// update vote counts and voters list
exports.updateCommentVote = async (id, userId, voteType, voteChange) => {
    const comment = await Comment.findById(id);
    if (!comment) return;

    // Older data may not have `voters` populated; normalize to an array.
    // basically a guard for old data
    const currentVoters = comment.voters || [];

    // remove existing vote if any
    comment.voters = currentVoters.filter((v) => v.userId?.toString() !== userId.toString());
    // add new vote if not there
    if (voteType !== null) {
        comment.voters.push({ userId, voteType });
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

// Delete all comments under a post (used for cascade delete when a post is deleted).
exports.deleteCommentsByPostId = async (postId) => {
    return await Comment.deleteMany({ postId });
};

