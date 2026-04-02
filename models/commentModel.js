const mongoose = require("mongoose");
const Post = require("./postModel");

const voterSchema = new mongoose.Schema({
    // userId so votes survive username changes/deletion.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
}, { _id: false });

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    image: {type: String, default:null},
    content: { type: String, default: "" },
    votes: { type: Number, default: 0 },
    voters: [voterSchema],
});

const Comment = mongoose.model("Comment", commentSchema, "comment");

//Function getAllcomment retrieves comments data based on the postId of the post
exports.getCommentsByPost = async (postId) => {
    return await Comment.find({ postId }).populate("authorId", "name");
};

// function getCommentById retrieves comment id for editing and deleting
exports.getCommentById = async (id) => {
  return await Comment.findById(id);
};

//function getCommentByAuthor retrieves all comments made by a specific user
exports.getCommentByAuthorId = async (authorId) => {
    return await Comment.find({ authorId });
};

//Function createComment to create a new comment and insert into mongo
exports.createComment = async (postId, commentData) => {
    const comment = new Comment({ ...commentData, postId });
    await comment.save();

    // increase comment post for post when new comment is created
    await Post.incrementCommentCount(postId,1);

    return comment;
};

// update vote counts and voters list
exports.updateCommentVote = async (id, userId, voteType, voteChange) => {
	// Atomically remove existing vote and update count
	await Comment.findByIdAndUpdate(id, {
		$pull: { voters: { userId } }, // remove existing vote if any
		$inc: { votes: voteChange },
	});

	// Atomically add new vote if not removing
	if (voteType !== null) {
		await Comment.findByIdAndUpdate(id, {
			$push: { voters: { userId, voteType } },
		});
	}
};

//editing logged in user post
exports.editComment = async (id, updatedData) => {
    return await Comment.findByIdAndUpdate(id, updatedData);
};

//deleting logged in user post
exports.deleteComment = async (id, postId) => {
    await Comment.findByIdAndDelete(id);
    // Keep commentCount in sync when deleting comments
    await Post.incrementCommentCount(postId, -1);
};

// Delete all comments under a post when a post is deleted
exports.deleteCommentsByPostId = async (postId) => {
    return await Comment.deleteMany({ postId });
};

