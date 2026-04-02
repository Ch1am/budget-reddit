const postModel = require('../models/postModel');
const timeAgo = require("../functions/timeAgo")
const Community = require('../models/communityModel');

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
		const sortedPosts = posts.slice().sort((a, b) => {
			const voteDiff = (b.votes ?? 0) - (a.votes ?? 0);
			if (voteDiff !== 0) return voteDiff;
			return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
		});
		const sessionUserId = req.session?.user || null;

		const postsWithVotes = sortedPosts.map((post) => {
			const existingVote = sessionUserId
				? (post.voters || []).find(
						(voter) => voter.userId?.toString() === sessionUserId.toString(),
					)
				: null;
			return {
				...post,
				displayAuthor:
					(post.authorId && post.authorId.name) ||
					"Deleted-User",
				userVote: existingVote ? existingVote.voteType : null,
				query,
			};
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
