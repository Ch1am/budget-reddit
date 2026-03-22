const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  username: String,
  voteType: String
});

const postSchema = new mongoose.Schema({
  author:       { type: String, required: true ,default: "guest"},
  title:        { type: String, required: true },
  snippet:      { type: String, required: true },
  image: {       data: { type: Buffer, default: null }, contentType:{type:String,default:null}},
  tag:          { type: String },
  votes:        { type: Number, default: 0 },
  voters:       [voterSchema],
  commentCount: { type: Number, default: 0 },
  createdAt:    { type: Date }
});


const Post = mongoose.model('Post', postSchema, 'posts');


//Function getAllPost retrieves all data
const getAllPost = async () => {
    return await Post.find().lean();
};

//Function to get sigle post by id
const getPostById = async (id) => {
	return await Post.findById(id).lean();
};

//Function createPost to create a new post and insert into mongo
const createPost = async (postData) => {
  const post = new Post(postData);
  return await post.save();
};

// update vote count and voters list
const updateVote = async (id, username, voteType, voteChange) => {
  const post = await Post.findById(id);
  // remove existing vote if any
  post.voters = post.voters.filter(v => v.username !== username);
  // add new vote if not removing
  if (voteType !== null) {
    post.voters.push({ username, voteType });
  }
  // update vote count
  post.votes += voteChange;

  // save back to MongoDB
  await post.save();
};

const updatePost = async (id, updatedData) => {
  return await Post.findByIdAndUpdate(id, updatedData);
};

const deletePost = async (id) => {
  return await Post.findByIdAndDelete(id);
};

module.exports = {getAllPost, getPostById, createPost, updateVote};
