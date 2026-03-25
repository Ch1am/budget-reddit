const Comment = require("../models/commentModel");
const User = require("../models/registerModel");

/**
 * Create a comment under a specific post.
 * Route shape (see `routes/comment.js`): POST `/post/:postId/comment`
 */
exports.createComment = async (req, res) => {
  // Basic guard: only logged-in users can create comments.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    // Load the logged-in user's details (name/author) from the DB.
    const userInfo = await User.findByUserID(req.session.user);

    // Comment text comes from the form body.
    const { content } = req.body;

    // The post id comes from the URL params.
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

    // After creating, redirect back to the post so the user sees the new comment.
    res.redirect(`/post/${postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating comment");
  }
};

/**
 * Edit an existing comment.
 * Route shape: POST `/comment/:id/edit`
 */
exports.editComment = async (req, res) => {
  // Only logged-in users can edit.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    // Load user so we can enforce "only the author can edit".
    const userInfo = await User.findByUserID(req.session.user);

    // Load the comment by its id.
    const comment = await Comment.getCommentById(req.params.id);

    // Ownership check: if missing or not authored by the current user, deny.
    if (!comment || comment.author !== userInfo.name)
      return res.redirect(`/post/${comment.postId}`);

    // Only allow updating `content` (image editing can be added later).
    const { content } = req.body;
    await Comment.editComment(req.params.id, { content });

    // Redirect back to the post containing the edited comment.
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing comment");
  }
};

/**
 * Delete an existing comment.
 * Route shape: POST `/comment/:id/delete`
 */
exports.deleteComment = async (req, res) => {
  // Only logged-in users can delete.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    // Load user for ownership check.
    const userInfo = await User.findByUserID(req.session.user);

    // Fetch comment to find its postId for redirect.
    const comment = await Comment.getCommentById(req.params.id);

    // Ownership check.
    if (!comment || comment.author !== userInfo.name)
      return res.redirect(`/post/${comment.postId}`);

    // Delete comment and update post commentCount in the model layer.
    await Comment.deleteComment(req.params.id, comment.postId);

    // Redirect back to the post after deletion.
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting comment");
  }
};

/**
 * Upvote a comment.
 * Route shape: POST `/comment/:id/upvote`
 *
 * Vote logic:
 * - If the user hasn't voted yet => add upvote (+1)
 * - If the user already upvoted => toggle off (remove upvote, -1)
 * - If the user downvoted => flip to upvote (+2: -1 down +2 up effect)
 */
exports.upvoteComment = async (req, res) => {
  // Only logged-in users can vote.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    // Get current user's identity (stored in voters as `username`).
    const userInfo = await User.findByUserID(req.session.user);
    const username = userInfo.name;

    // Load comment so we can inspect existing votes.
    const comment = await Comment.getCommentById(req.params.id);

    if (!comment) return res.status(404).send("Comment not found");

    const existingVoter = comment.voters?.find((v) => v.username === username);
    let voteType = "upvote";
    let voteChange;

    // Decide what to do based on existing vote state.
    if (!existingVoter) {
      // First time voting.
      voteChange = 1;
    } else if (existingVoter.voteType === "upvote") {
      // Toggle off: remove the upvote.
      voteType = null;
      voteChange = -1;
    } else {
      // Flip from downvote to upvote.
      voteChange = 2;
    }

    // Model updates both `votes` and the `voters` array.
    await Comment.updateCommentVote(req.params.id, username, voteType, voteChange);
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error upvoting comment");
  }
};

/**
 * Downvote a comment.
 * Route shape: POST `/comment/:id/downvote`
 *
 * Vote logic mirrors upvote:
 * - none => add downvote (-1)
 * - already downvoted => toggle off (+1)
 * - upvoted => flip to downvote (-2)
 */
exports.downvoteComment = async (req, res) => {
  // Only logged-in users can vote.
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    // Current user identity.
    const userInfo = await User.findByUserID(req.session.user);
    const username = userInfo.name;

    // Load comment for existing vote inspection.
    const comment = await Comment.getCommentById(req.params.id);

    if (!comment) return res.status(404).send("Comment not found");

    const existingVoter = comment.voters?.find((v) => v.username === username);
    let voteType = "downvote";
    let voteChange;

    // Decide what to do based on existing vote state.
    if (!existingVoter) {
      // First time voting.
      voteChange = -1;
    } else if (existingVoter.voteType === "downvote") {
      // Toggle off: remove the downvote.
      voteType = null;
      voteChange = 1;
    } else {
      // Flip from upvote to downvote.
      voteChange = -2;
    }

    // Update comment votes in the model layer.
    await Comment.updateCommentVote(req.params.id, username, voteType, voteChange);
    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downvoting comment");
  }
};
