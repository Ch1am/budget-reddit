const Comment = require('../models/commentModel');
const User = require('../models/registerModel');

const isCommentOwnerOrAdmin = async (req, res, next) => {
  try {
    const comment = await Comment.getCommentById(req.params.id);
    const userInfo = await User.findByUserID(req.session.user);
    const isAdmin = userInfo?.type === 'admin';

    const isOwner =
      comment.authorId &&
      (comment.authorId._id ? comment.authorId._id.toString() : comment.authorId.toString()) ===
        userInfo._id.toString();

    if (!isOwner && !isAdmin) {
      return res.redirect('back');
    }

    req.comment = comment;
    req.userInfo = userInfo;
    req.isAdmin = isAdmin;

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Authorization error');
  }
};

module.exports = { isCommentOwnerOrAdmin };