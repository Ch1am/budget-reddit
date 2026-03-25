const mongoose = require("mongoose");

// Voter embedded schema for post upvotes/downvotes
const voterSchema = new mongoose.Schema({
  username: String,
  voteType: String,
});

// Main Post schema
const postSchema = new mongoose.Schema({
  author: { type: String, required: true, default: "guest" },
  title: { type: String, required: true },
  snippet: { type: String, required: true },
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
  return await Post.find().lean();
};

// Function to get a single post by id
exports.getPostById = async (id) => {
  return await Post.findById(id).lean();
};

// Function getPostsByAuthor retrieves posts made by author
exports.getPostsByAuthor = async (author) => {
  return await Post.find({ author }).lean();
};

// Function createPost creates and saves a new post
exports.createPost = async (postData) => {
  const post = new Post(postData);
  return await post.save();
};

// updateVote updates vote count and voters array
exports.updateVote = async (id, username, voteType, voteChange) => {
  const post = await Post.findById(id);

  // Remove existing vote if any
  post.voters = post.voters.filter((v) => v.username !== username);

  // Add new vote if not removing (toggle off sets voteType to null)
  if (voteType !== null) {
    post.voters.push({ username, voteType });
  }

  // Update vote total
  post.votes += voteChange;

  // Save back to MongoDB
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

// Increment (or decrement) a post's `commentCount`.
// This is called by `commentModel` when comments are created/deleted.
exports.incrementCommentCount = async (postId, delta) => {
  return await Post.findByIdAndUpdate(postId, { $inc: { commentCount: delta } });
};
