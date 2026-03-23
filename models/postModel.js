const fs = require("node:fs/promises");
const path = require("path");
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
  community:    { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null },
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
  return await post.save();;
};

//deleting logged in user post
const deletePost = async (id) => {
  return await Post.findByIdAndDelete(id);
};

module.exports = {getAllPost, getPostById, createPost, deletePost};
