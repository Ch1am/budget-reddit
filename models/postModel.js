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
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  image: {
    data: { type: Buffer, default: null },
    contentType: { type: String, default: null },
  },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null },
  votes: { type: Number, default: 0 },
  voters: [voterSchema],
  commentCount: { type: Number, default: 0 },
  createdAt: { type: Date },
});

const Post = mongoose.model("Post", postSchema, "posts");

// Function getAllPost retrieves all posts
exports.getAllPost = async () => {
  return await Post.find().populate("authorId", "name type");
};

// Function to get a single post by id
exports.getPostById = async (id) => {
  return await Post.findById(id).populate("authorId", "name type");
};

// Function getPostsByAuthorId retrieves posts made by user id (preferred).
exports.getPostsByAuthorId = async (authorId) => {
  return await Post.find({ authorId }).populate("authorId", "name type");
};

// Function createPost creates and saves a new post
exports.createPost = async (postData) => {
  const post = new Post(postData);
  return await post.save();
};

// updateVote updates vote count and voters array
exports.updateVote = async (id, userId, voteType, voteChange) => {
  const post = await Post.findById(id);

  // Remove existing vote if any
  post.voters = (post.voters || []).filter((v) => v.userId?.toString() !== userId.toString());

  // Add new vote if not removing
  if (voteType !== null) {
    post.voters.push({ userId, voteType });
  }

  // Update vote total
  post.votes += voteChange;

  // Save to MongoDB
  await post.save();
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
