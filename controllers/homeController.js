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
		const query = req.query.query
		let posts = []

		console.log(query)
		if (query && query.length > 0) {
			posts = await postModel.getPostByGeneralSearch(query);
			console.log(posts)
		} else {
			posts = await postModel.getAllPost();
		}
		
		posts = await Promise.all(posts.map(async (p) => {
			const pObj = typeof p.toObject === "function" ? p.toObject() : p;
			if (p.community) {
				pObj.community = await Community.findCommunityById(p.community);
			}
			
			return pObj; 
		}));

		// Sort by net score (votes) descending; tie-break by newest first.
		const sortedPosts = posts.slice().sort((a, b) => {
			const voteDiff = (b.votes ?? 0) - (a.votes ?? 0);
			if (voteDiff !== 0) return voteDiff;
			return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
		});
		const sessionUserId = req.session?.user || null;
		const currentUser = sessionUserId ? await User.findByUserID(sessionUserId) : null;

		const postsWithVotes = sortedPosts.map((post) => {
			//just to test if i up/downvote, whether the button will remain highlighted
			const existingVote = sessionUserId
				? (post.voters || []).find(
						(voter) => voter.userId?.toString() === sessionUserId.toString(),
					)
				: null;

			//converting the img buffer to base64 string for ejs
			let imageBase64 = null;
			if (post.image && post.image.data) {
				const buf = Buffer.isBuffer(post.image.data)
					? post.image.data
					: post.image.data.buffer
						? Buffer.from(post.image.data.buffer)
						: Buffer.from(post.image.data);
				imageBase64 = buf.toString('base64');
			}
			return {
				...post,
				displayAuthor:
					(post.authorId && post.authorId.name) ||
					"Deleted-User",
				userVote: existingVote ? existingVote.voteType : null,
				imageBase64,
				imageType: post.image ? post.image.contentType : null,
				query
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
	const sessionUserId = req.session?.user;

	try {
		const post = await postModel.getPostById(id);
		const existingVote = (post.voters || []).find(
		(v) => v.userId?.toString() === sessionUserId.toString(),
		);

		if (!existingVote) {
		await postModel.updateVote(id, sessionUserId, 'upvote', 1);
		} else if (existingVote.voteType === 'upvote') {
		await postModel.updateVote(id, sessionUserId, null, -1);
		} else {
		await postModel.updateVote(id, sessionUserId, 'upvote', 2);
		}
	} catch (error) {
		console.error(error);
	}
	res.redirect(`/home#post-${id}`);
};

exports.downvote = async (req, res) => {
	const id = req.params.id;
	const sessionUserId = req.session?.user;

	try {
		const post = await postModel.getPostById(id);
		const existingVote = (post.voters || []).find(
		(v) => v.userId?.toString() === sessionUserId.toString(),
		);

		if (!existingVote) {
		await postModel.updateVote(id, sessionUserId, 'downvote', -1);
		} else if (existingVote.voteType === 'downvote') {
		await postModel.updateVote(id, sessionUserId, null, 1);
		} else {
		await postModel.updateVote(id, sessionUserId, 'downvote', -2);
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
