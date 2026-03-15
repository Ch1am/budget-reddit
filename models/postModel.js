const fs = require("node:fs/promises");
const path = require("path");
const postsPath = path.join(__dirname, "../data/posts.json");
const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  username: String,
  voteType: String
});

const postSchema = new mongoose.Schema({
  author:       { type: String, required: true },
  title:        { type: String, required: true },
  snippet:      { type: String, required: true },
  image:        { type: String, default: null },  // file path or URL
  tag:          { type: String },
  votes:        { type: Number, default: 0 },
  voters:       [voterSchema],
  commentCount: { type: Number, default: 0 },
  createdAt:    { type: String }
});


const Post = mongoose.model('Post',postSchema, 'posts');


//Function getAll retrieves all data in posts.json || needs to be updated when move over to MongoDB
const getAllPost = async () => {
    return await Post.find();
};

//Function insertAll takes in array of posts, converts into Json strings and writes to posts.json || needs to be updated when move over to MongoDB
const insertAll = async (posts) =>{
    const jsonData = JSON.stringify(posts, null, 2);
    await fs.writeFile(postsPath, jsonData);
}

module.exports = {getAllPost, insertAll };
