const Comment = require("../models/commentModel");
const User = require("../models/registerModel");
const timeAgo = require("../functions/timeAgo");

exports.createComment = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const { content } = req.body;
    const postId = req.params.postId;

    if (!content) return res.redirect(`/post/${postId}`);

    const image = req.file
      ? { data: req.file.buffer, contentType: req.file.mimetype }
      : { data: null, contentType: null };

    await Comment.createComment(postId, {
      author: userInfo.name,
      content,
      image,
      votes: 0,
      voters: [],
      createdAt: new Date(),
    });

    res.redirect(`/post/${postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating comment");
  }
};

exports.editComment = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const comment = await Comment.getCommentById(req.params.id);

    if (!comment || comment.author !== userInfo.name)
      return res.redirect(`/post/${comment.postId}`);

    const { content } = req.body;
    await Comment.editComment(req.params.id, { content });

    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing comment");
  }
};

exports.deleteComment = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const comment = await Comment.getCommentById(req.params.id);

    if (!comment || comment.author !== userInfo.name)
      return res.redirect(`/post/${comment.postId}`);

    await Comment.deleteComment(req.params.id, comment.postId);

    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting comment");
  }
};

exports.upvoteComment = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const username = userInfo.name;
    const comment = await Comment.getCommentById(req.params.id);

    const existingVoter = comment.voters.find(v => v.username === username);
    let voteType = "upvote";
    let voteChange;

    if (!existingVoter) {
      voteChange = 1;
    } else if (existingVoter.voteType === "upvote") {
      voteType = null; // toggle off
      voteChange = -1;
    } else {
      voteChange = 2; // flip from downvote
    }

    await Comment.updateCommentVote(req.params.id, username, voteType, voteChange);
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error upvoting comment");
  }
};

exports.downvoteComment = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const username = userInfo.name;
    const comment = await Comment.getCommentById(req.params.id);

    const existingVoter = comment.voters.find(v => v.username === username);
    let voteType = "downvote";
    let voteChange;

    if (!existingVoter) {
      voteChange = -1;
    } else if (existingVoter.voteType === "downvote") {
      voteType = null; // toggle off
      voteChange = 1;
    } else {
      voteChange = -2; // flip from upvote
    }

    await Comment.updateCommentVote(req.params.id, username, voteType, voteChange);
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downvoting comment");
  }
};
