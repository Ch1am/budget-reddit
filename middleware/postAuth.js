const Post = require('../models/postModel');
const User = require('../models/registerModel');

const isPostOwnerOrAdmin = async (req, res, next) => {
  try {
    const post = await Post.getPostById(req.params.id);
    const userInfo = await User.findByUserID(req.session.user);
    const isAdmin = userInfo?.type === 'admin';

    const isOwner =
      post.authorId &&
      (post.authorId._id ? post.authorId._id.toString() : post.authorId.toString()) ===
        userInfo._id.toString();

    if (!isOwner && !isAdmin) {
      return res.redirect(`/post/${req.params.id}`);
    }

    // attach to req so controller can use it without fetching again
    req.post = post;
    req.userInfo = userInfo;
    req.isAdmin = isAdmin;

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Authorization error');
  }
};

module.exports = { isPostOwnerOrAdmin };