const Comment = require("../models/commentModel");
const User = require("../models/registerModel");

exports.createComment = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const { content } = req.body;
    const postId = req.params.postId;

    // Server-side validation:
    // Allow the user to submit either:
    // - text content, OR
    // - an uploaded image
    // Reject only when BOTH are missing (no empty comments).
    const trimmedText = typeof content === "string" ? content.trim() : "";
    const hasText = trimmedText.length > 0;
    const hasImage = !!req.file;

    // Optional image upload: multer stores the uploaded file in `req.file`.
    const image = hasImage
      ? { data: req.file.buffer, contentType: req.file.mimetype }
      : { data: null, contentType: null };

    // Reject empty request (no text AND no image).
    if (!hasText && !hasImage) return res.redirect(`/post/${postId}`);

    // Persist the comment + return to the post page.
    await Comment.createComment(postId, {
      author: userInfo.name,
      // Store empty string for image-only comments.
      content: hasText ? trimmedText : "",
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

    if (!comment) return res.status(404).send("Comment not found");

    const existingVoter = comment.voters?.find((v) => v.username === username);
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

    if (!comment) return res.status(404).send("Comment not found");

    const existingVoter = comment.voters?.find((v) => v.username === username);
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
