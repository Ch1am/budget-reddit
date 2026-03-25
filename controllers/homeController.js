const postModel = require('../models/postModel');
const timeAgo = require("../functions/timeAgo")
const User = require("../models/registerModel")
const mongoose = require('mongoose');
const Community = require('../models/communityModel');
const collectionController = require("./collectionController");

//displayAllPost diplays everything from newest order in the array (added last in the array)
exports.displayAllPost = async (req, res) => {
	try {
		const session = req.session
		// user information
		let posts = await postModel.getAllPost();
		posts = await Promise.all(posts.map(async (p) => {
			if (p.community) {
				p.community = await Community.findCommunityById(p.community);
			}
			
			return p; 
		}));

		const reversedPosts = posts.slice().reverse() //this reverse line just flips the array so the newst post is at the top
		const currentUser = await User.findByUserID(req.session.user) 
		const username = currentUser.name


		const postsWithVotes = reversedPosts.map((post) => {
			//just to test if i up/downvote, whether the button will remain highlighted
			const existingVote = post.voters.find((voter) => voter.username === username);

			//converting the img buffer to base64 string for ejs
			let imageBase64 = null;
			if (post.image && post.image.data) {
				imageBase64 = Buffer.from(post.image.data.buffer).toString('base64');
			}
			return {
				...post,
				userVote: existingVote ? existingVote.voteType : null,
				imageBase64,
				imageType: post.image ? post.image.contentType : null
			};
		});

		let data = req.query.query
		data = data ? data : undefined
		res.render("landing", {
			posts: postsWithVotes,
			query: data,
			timeAgo,
			inCommunity: false
		})
	} catch (error) {
		console.error(error);
		console.log('Mongoose state:', mongoose.connection.readyState);
		res.send("Error reading database " + error.message);
	}
}

exports.upvote = async (req, res) => {
  const id = req.params.id;
  const currentUser = await User.findByUserID(req.session.user);
  const username = currentUser.name;

  try {
    const post = await postModel.getPostById(id);
    const existingVote = post.voters.find((v) => v.username === username);

    if (!existingVote) {
      await postModel.updateVote(id, username, 'upvote', 1);
    } else if (existingVote.voteType === 'upvote') {
      await postModel.updateVote(id, username, null, -1);
    } else {
      await postModel.updateVote(id, username, 'upvote', 2);
    }
  } catch (error) {
    console.error(error);
  }
  res.redirect(`/home#post-${id}`);
};

exports.downvote = async (req, res) => {
  const id = req.params.id;
  const currentUser = await User.findByUserID(req.session.user);
  const username = currentUser.name;

  try {
    const post = await postModel.getPostById(id);
    const existingVote = post.voters.find((v) => v.username === username);

    if (!existingVote) {
      await postModel.updateVote(id, username, 'downvote', -1);
    } else if (existingVote.voteType === 'downvote') {
      await postModel.updateVote(id, username, null, 1);
    } else {
      await postModel.updateVote(id, username, 'downvote', -2);
    }
  } catch (error) {
    console.error(error);
  }
  res.redirect(`/home#post-${id}`);
};

// Collection routes are now handled by `collectionController`.
// These exports remain only as delegations for any old references.
exports.showAddCollection = (req, res) =>
  collectionController.showAddCollection(req, res);

exports.addCollection = (req, res) =>
  collectionController.addCollection(req, res);

exports.showCollections = (req, res) =>
  collectionController.showCollections(req, res);

exports.displayPostInCollection = (req, res) =>
  collectionController.displayPostInCollection(req, res);

exports.renameCollection = (req, res) =>
  collectionController.renameCollection(req, res);

exports.deleteCollection = (req, res) =>
  collectionController.deleteCollection(req, res);

exports.removePostsFromCollection = (req, res) =>
  collectionController.removePostsFromCollection(req, res);

exports.showRenameCollection = (req, res) =>
  collectionController.showRenameCollection(req, res);
