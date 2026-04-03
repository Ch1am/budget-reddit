const mongoose = require("mongoose");

// Voter schema for post upvotes/downvotes
const voterSchema = new mongoose.Schema({
	// userId so votes survive username changes/deletion.
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	voteType: { type: String, enum: ["upvote", "downvote"], required: true },
});

// Main Post schema
const postSchema = new mongoose.Schema({
  	//store userId so posts can still render after account deletion.
	authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
	title: { type: String, required: true },
	desc: { type: String, required: true },
	image: {type: String, default: null},
	community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null },
	votes: { type: Number, default: 0 },
	voters: [voterSchema],
	commentCount: { type: Number, default: 0 },
	createdAt: { type: Date },
});

const Post = mongoose.model("Post", postSchema, "posts");

// Function getAllPost retrieves all posts
exports.getAllPost = async () => {
	return await Post.find().populate("authorId", "name type").populate("community", "name");
};

// Function getPostByGeneralSearch retrieves post with querty
exports.getPostByGeneralSearch = async (searchQuery) => {
    if (!searchQuery) {
        return await Post.find().populate("authorId", "name type").populate("community", "name");
    }

    return await Post.find({
        $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { desc: { $regex: searchQuery, $options: "i" } }
        ]
    }).populate("authorId", "name type").populate("community", "name");
};

// Function to get a single post by id
exports.getPostById = async (id) => {
	return await Post.findById(id).populate("authorId", "name type").populate("community", "name");
};

// Function getPostsByAuthorId retrieves posts made by user id (preferred).
exports.getPostsByAuthorId = async (authorId) => {
	return await Post.find({ authorId }).sort({ createdAt: -1 }).populate("authorId", "name type").populate("community", "name");
};

// Function createPost creates and saves a new post
exports.createPost = async (postData) => {
	const post = new Post(postData);
	return await post.save();
};

// updateVote updates vote count and voters array atomically as learnt in lesson 9 extra
//takes in 4 fields, postID, userID to know who user is, voteType either up or down, and lastly the number change
exports.updateVote = async (id, userId, voteType, voteChange) => {
	// Atomically remove existing vote and update count
	await Post.findByIdAndUpdate(id, {
		$pull: { voters: { userId } }, // removes the user from the voter array
		$inc: { votes: voteChange }, //changes the total vote number
	});

	// Atomically add new vote if not removing
	if (voteType !== null) {
		await Post.findByIdAndUpdate(id, {
			$push: { voters: { userId, voteType } }, //adds the new user to voter array and their vote type (up/down)
		});
	}
};

// Editing logged-in user's post
exports.updatePost = async (id, updatedData) => {
	return await Post.findByIdAndUpdate(id, updatedData);
};

// Deleting logged-in user's post
exports.deletePost = async (id) => {
	return await Post.findByIdAndDelete(id);
};

// increase or decrease a post commentCount
exports.incrementCommentCount = async (postId, delta) => {
	return await Post.findByIdAndUpdate(postId, { $inc: { commentCount: delta } });
};

// changes the author into null should their account be deleted
exports.nullifyAuthor = async (authorId) => {
	return await Post.updateMany({ authorId }, { $set: { authorId: null } });
};
