const postModel = require("../models/postModel");
const timeAgo = require("../functions/timeAgo");
const User = require("../models/registerModel");
const mongoose = require("mongoose");

//displayAllPost diplays everything from newest order in the array (added last in the array)
exports.displayAllPost = async (req, res) => {
  try {
    // session check
    const session = req.session;
    if (!session || !session.user) {
      return res.redirect("/login");
    }

    // user information
    const userInfo = await User.findByUserID(session.user);
    let posts = await postModel.getAllPost();
    const reversedPosts = posts.slice().reverse(); //this reverse line just flips the array so the newst post is at the top
    const name = userInfo.name;

    const postsWithVotes = reversedPosts.map((post) => {
      //existingVote checks if user has voted on any post before, then renders the vote button color
      const existingVote = post.voters.find((voter) => voter.name === name);

      //converting the img buffer to base64 string for ejs
      let imageBase64 = null;
      if (post.image && post.image.data) {
        imageBase64 = Buffer.from(post.image.data.buffer).toString("base64");
      }
      return {
        ...post,
        userVote: existingVote ? existingVote.voteType : null,
        imageBase64,
        imageType: post.image ? post.image.contentType : null,
      };
    });

    let data = req.query.query;
    data = data ? data : undefined;

    res.render("landing", {
      posts: postsWithVotes,
      query: data,
      timeAgo,
    });
  } catch (error) {
    console.error(error);
    console.log("Mongoose state:", mongoose.connection.readyState);
    res.send("Error reading database " + error.message);
  }
};

exports.upvote = async (req, res) => {
  const id = req.params.id;
  const userInfo = await User.findByUserID(req.session.user);
  const username = userInfo.username;

  try {
    //find post and whether this user has voted before anot
    const post = await postModel.getPostById(id);
    const existingVote = post.voters.find((v) => v.username === username);

    //handling of whether the vote exist before
    if (!existingVote) {
      //if nvr vote before, upvote by 1
      await postModel.updateVote(id, username, "upvote", 1);
      //if got upvote before, and user click on upvote again, minus 1
    } else if (existingVote.voteType === "upvote") {
      await postModel.updateVote(id, username, null, -1);
    } else {
      //if user downvoted before and now change to upvote, +2
      await postModel.updateVote(id, username, "upvote", 2);
    }
  } catch (error) {
    console.error(error);
  }
  res.redirect(`/home#post-${id}`);
};

exports.downvote = async (req, res) => {
  const id = req.params.id;
  const userInfo = await User.findByUserID(req.session.user);
  const username = userInfo.username;

  try {
    //same logic as upvoting
    const post = await postModel.getPostById(id);
    const existingVote = post.voters.find((v) => v.username === username);

    if (!existingVote) {
      await postModel.updateVote(id, username, "downvote", -1);
    } else if (existingVote.voteType === "downvote") {
      await postModel.updateVote(id, username, null, 1);
    } else {
      await postModel.updateVote(id, username, "downvote", -2);
    }
  } catch (error) {
    console.error(error);
  }
  res.redirect(`/home#post-${id}`);
};
