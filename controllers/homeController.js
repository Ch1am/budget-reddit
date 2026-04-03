const postModel = require('../models/postModel');
const timeAgo = require("../functions/timeAgo")
const Community = require('../models/communityModel');
const User = require("../models/registerModel");

exports.displayAllPost = async (req, res) => {
	try {
		const query = typeof req.query?.query === "string" ? req.query.query.trim() : "";
		let posts = []

		if (query.length > 0) {
			posts = await postModel.getPostByGeneralSearch(query);
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
		//use slice to create a new array to avoid mutating the original array
		const sortedPosts = [...posts].sort((a, b) => {
			const aVotes = a.votes || 0;
			const bVotes = b.votes || 0;
			if (aVotes !== bVotes)
				return bVotes - aVotes;

			//use getTime to compare the time
			const aTime = new Date(a.createdAt || 0).getTime();
			const bTime = new Date(b.createdAt || 0).getTime();
			return bTime - aTime;
		});

		//get the session user id from the session
		const sessionUserId = req.session?.user || null;

		const postsWithVotes = sortedPosts.map((post) => {
			const voters = post.voters || [];
			let existingVote = null;

			//find the vote of the session user if they have voted before
			if (sessionUserId) {
				const sid = sessionUserId.toString();
				existingVote =
					voters.find((v) => v.userId && v.userId.toString() === sid) || null;
			}

			//get the display author name
			const displayAuthor =
				post.authorId && post.authorId.name ? post.authorId.name : "Deleted-User";

			//get the user vote if they have voted before
			const userVote = existingVote ? existingVote.voteType : null;

			//return the post with the display author name, user vote, and query
			return { ...post, displayAuthor, userVote, query };
		});

		res.render("landing", {
			posts: postsWithVotes,
			query: query.length > 0 ? query : undefined,
			timeAgo,
			inCommunity: false
		})
	} catch (error) {
		console.error(error);
		res.send("Error reading database " + error.message);
	}
}

exports.upvote = async (req, res) => {
	const id = req.params.id;
	const userInfo = await User.findByUserID(req.session.user);
	const userId = userInfo._id;

	try {
		const post = await postModel.getPostById(id);
		const existingVote = post.voters.find(
			(v) => v.userId && v.userId.toString() === userId.toString(),
		);

		if (!existingVote) {
			await postModel.updateVote(id, userId, "upvote", 1);
		} else if (existingVote.voteType === "upvote") {
			await postModel.updateVote(id, userId, null, -1);
		} else {
			await postModel.updateVote(id, userId, "upvote", 2);
		}
	} catch (error) {
		console.error(error);
	}
	res.redirect(`/home#post-${id}`);
};

exports.downvote = async (req, res) => {
	const id = req.params.id;
	const userInfo = await User.findByUserID(req.session.user);
	const userId = userInfo._id;

	try {
		const post = await postModel.getPostById(id);
		const existingVote = post.voters.find(
			(v) => v.userId && v.userId.toString() === userId.toString(),
		);

		if (!existingVote) {
			await postModel.updateVote(id, userId, "downvote", -1);
		} else if (existingVote.voteType === "downvote") {
			await postModel.updateVote(id, userId, null, 1);
		} else {
			await postModel.updateVote(id, userId, "downvote", -2);
		}
	} catch (error) {
		console.error(error);
	}
	res.redirect(`/home#post-${id}`);
};
