const mongoose = require('mongoose');
const Post = require('../models/postModel');
const User = require('../models/registerModel');

const isPostOwnerOrAdmin = async (req, res, next) => {
  try {
    const postId = req.params.id;

    // 1. Invalid Mongo ID format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).send('Invalid post ID');
    }

    // 2. Post not found
    const post = await Post.getPostById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // 3. Session user missing
    if (!req.session.user) {
      return res.status(401).send('Login required');
    }

    // 4. User not found
    const userInfo = await User.findByUserID(req.session.user);
    if (!userInfo) {
      return res.status(401).send('Invalid session user');
    }

    const isAdmin = userInfo.type === 'admin';

    let authorId = null;
    if (post.authorId) {
      if (post.authorId._id) {
        authorId = post.authorId._id.toString(); // the actual mongoose doc, but i just want the id part
      } else {
        authorId = post.authorId.toString(); // this is basically just a id string
      }
    }

    const isOwner = authorId === userInfo._id.toString();

    // 5. Exists, but user not allowed
    if (!isOwner && !isAdmin) {
      return res.status(403).send('Authorization error');
    }

    req.post = post;
    req.userInfo = userInfo;
    req.isAdmin = isAdmin;

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
};

module.exports = { isPostOwnerOrAdmin };