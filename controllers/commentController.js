const Comment = require("../models/commentModel");
const User = require("../models/registerModel");
const { validateImageUrl } = require("../functions/validateImageUrl");

// POST `/post/:postId/comment`
exports.createComment = async (req, res) => {
  try {
    // get the current user info
    const userInfo = await User.findByUserID(req.session.user);

    // Comment text comes from the form body.
    const content = req.body.content;

    // get the postID from url
    const postId = req.params.postId;

    // trim to check if it just blanks
    const trimmedText = typeof content === "string" ? content.trim() : "";
    // check if there's text content
    const hasText = trimmedText.length > 0;
    // URL-only image field. We accept any non-empty string here.
    const image =
      typeof req.body.image === "string" && req.body.image.trim()
        ? req.body.image.trim()
        : null;
    const hasImage = Boolean(image);

    //send back to the post page if the image url is invalid
    if (hasImage && !(await validateImageUrl(image))) {
      return res.redirect(`/post/${postId}?invalidImage=1`);
    }

    // stop comment that has no text and image
    if (!hasText && !hasImage) return res.redirect(`/post/${postId}`);

    // create the comment in mongo
    await Comment.createComment(postId, {
      authorId: userInfo._id,
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
  try {
    // `commentAuth.isCommentOwnerOrAdmin` middleware attaches the comment.
    const comment = req.comment || (await Comment.getCommentById(req.params.id));
    if (!comment) 
      return res.redirect("back");

    const { content } = req.body;
    await Comment.editComment(req.params.id, { content });

    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing comment");
  }
};

// POST `/comment/:id/delete`
exports.deleteComment = async (req, res) => {
  try {
    // `commentAuth.isCommentOwnerOrAdmin` middleware attaches the comment.
    const comment = req.comment || (await Comment.getCommentById(req.params.id));
    if (!comment) 
      return res.redirect("back");

    await Comment.deleteComment(req.params.id, comment.postId);

    res.redirect(`/post/${comment.postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting comment");
  }
};

//POST `/comment/:id/upvote`

exports.upvoteComment = async (req, res) => {
  const id = req.params.id;
  const userInfo = await User.findByUserID(req.session.user);
  const username = userInfo.username;
  const comment = await Comment.getCommentById(id);

  try {
    //find post and whether this user has voted before anot
    const existingVote = comment.voters.find((v) => v.username === username);

    //handling of whether the vote exist before
    if (!existingVote) {
      //if nvr vote before, upvote by 1
      await Comment.updateCommentVote(id, username, "upvote", 1);
      //if got upvote before, and user click on upvote again, minus 1
    } else if (existingVote.voteType === "upvote") {
      await Comment.updateCommentVote(id, username, null, -1);
    } else {
      //if user downvoted before and now change to upvote, +2
      await Comment.updateCommentVote(id, username, "upvote", 2);
    }
  } catch (error) {
    console.error(error);
  }
  
  res.redirect(`/post/${comment.postId}`);
};


// POST `/comment/:id/downvote`
exports.downvoteComment = async (req, res) => {
  const id = req.params.id;
  const userInfo = await User.findByUserID(req.session.user);
  const username = userInfo.username;
  const comment = await Comment.getCommentById(id);

  try {
    //same logic as upvoting
    const existingVote = comment.voters.find((v) => v.username === username);

    if (!existingVote) {
      await Comment.updateCommentVote(id, username, "downvote", -1);
    } else if (existingVote.voteType === "downvote") {
      await Comment.updateCommentVote(id, username, null, 1);
    } else {
      await Comment.updateCommentVote(id, username, "downvote", -2);
    }
  } catch (error) {
    console.error(error);
  }

  res.redirect(`/post/${comment.postId}`);
};