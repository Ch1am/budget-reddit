const Comment = require("../models/commentModel");
const User = require("../models/registerModel");

// POST `/post/:postId/comment`
exports.createComment = async (req, res) => {
  // Only logged-in users can comment.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    // get the current user info
    const userInfo = await User.findByUserID(req.session.user);

    // Comment text comes from the form body.
    const { content } = req.body;

    // get the postID from url
    const postId = req.params.postId;

    // trim to check if it just blanks
    const trimmedText = typeof content === "string" ? content.trim() : "";
    // check if there's text content
    const hasText = trimmedText.length > 0;
    // check if user uploaded an image
    const hasImage = !!req.file;

    // check if user did upload an image and if so store it other null
    const image = hasImage
      ? { data: req.file.buffer, contentType: req.file.mimetype }
      : { data: null, contentType: null };

    // stop comment that has no text and image
    if (!hasText && !hasImage) return res.redirect(`/post/${postId}`);

    // create the comment in mongo
    await Comment.createComment(postId, {
      author: userInfo.name,
      // Store empty string if image-only
      content: hasText ? trimmedText : "",
      image,
      votes: 0,
      voters: [],
      createdAt: new Date(),
    });

    // redirect back to the post so the user can sees the new comment.
    res.redirect(`/post/${postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating comment");
  }
};

// POST `/comment/:id/edit`
exports.editComment = async (req, res) => {
  // Only logged-in users can edit.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);

    // get comment by its id.
    const comment = await Comment.getCommentById(req.params.id);

    // check if the comment belong to current user
    if (!comment || comment.author !== userInfo.name)
      return res.redirect(`/post/${comment.postId}`);

    // update the comment text content
    const { content } = req.body;
    await Comment.editComment(req.params.id, { content });

    // Redirect back to the post containing the edited comment.
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing comment");
  }
};

// POST `/comment/:id/delete`
exports.deleteComment = async (req, res) => {
  // Only logged-in users can delete.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const comment = await Comment.getCommentById(req.params.id);

    // check if the comment belong to current user
    if (!comment || comment.author !== userInfo.name)
      return res.redirect(`/post/${comment.postId}`);

    // delete comment and update post commentCount
    await Comment.deleteComment(req.params.id, comment.postId);

    // Redirect back to the post after deletion.
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting comment");
  }
};

//POST `/comment/:id/upvote`
exports.upvoteComment = async (req, res) => {
  // Only logged-in users can vote.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const userInfo = await User.findByUserID(req.session.user);
    const username = userInfo.name;

    // Load comment to check existing votes.
    const comment = await Comment.getCommentById(req.params.id);

    if (!comment) return res.status(404).send("Comment not found");

    const existingVoter = comment.voters?.find((v) => v.username === username);
    let voteType = "upvote";
    let voteChange;

    // check current vote state.
    if (!existingVoter) {
      // if no existing vote then just normal upvote
      voteChange = 1;
    } else if (existingVoter.voteType === "upvote") {
      // remove the upvote.
      voteType = null;
      voteChange = -1;
    } else {
      // if they got an downvote then remove that and then add the upvote
      voteChange = 2;
    }

    // updates both votes and voters array.
    await Comment.updateCommentVote(req.params.id, username, voteType, voteChange);
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error upvoting comment");
  }
};


// POST `/comment/:id/downvote`
// Function to downvote a comment
exports.downvoteComment = async (req, res) => {
  // Only logged-in users can vote.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {

    const userInfo = await User.findByUserID(req.session.user);
    const username = userInfo.name;

    // Load comment to check existing votes.
    const comment = await Comment.getCommentById(req.params.id);

    if (!comment) return res.status(404).send("Comment not found");

    const existingVoter = comment.voters?.find((v) => v.username === username);
    let voteType = "downvote";
    let voteChange;

    if (!existingVoter) {
      // if no existing vote then just normal downvote
      voteChange = -1;
    } else if (existingVoter.voteType === "downvote") {
      // if it does then remove their downvote
      voteType = null;
      voteChange = 1;
    } else {
      // if they got an upvote then remove that and then remove again to add the downvote
      voteChange = -2;
    }

    // update comment votes 
    await Comment.updateCommentVote(req.params.id, username, voteType, voteChange);
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downvoting comment");
  }
};
