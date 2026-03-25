const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo")
const User = require("./../models/registerModel")
const Community = require("./../models/communityModel")
const Comment = require("../models/commentModel");
const collectionModel = require("../models/collectionModel");
const collectionController = require("./collectionController");

exports.getSinglePost = async (req, res) => {
	try {
		// Used for comment editing UI views/partials/comment.ejs
		const editCommentId =
			typeof req.query.editCommentId === "string" && req.query.editCommentId.trim()
				? req.query.editCommentId.trim()
				: null;

		// list used by post-view.ejs to render the "Add to Collection" UI.
		const sessionUserId = req.session.user;
		const collectionList = await collectionModel.retrieveAll(sessionUserId);
		const postDoc = await Post.getPostById(req.params.id);

		// get the current logged in user and check if they are an admin
		const currentUser = await User.findByUserID(sessionUserId);
		const isAdmin = currentUser?.type === "admin";

		// if post dont exist still provide fields that can be used
		if (!postDoc) {
			return res.status(404).render("post/post-view", {
				post: null,
				comments: [],
				timeAgo,
				collectionList,
				currentUser,
				sessionUserId,
				isAdmin,
				editCommentId,
			});
		}
		const post = postDoc.toObject();
		// Keep a stable author id string for comparisons in controllers/views.
		const postAuthorIdStr = post.authorId
			? (post.authorId._id ? post.authorId._id.toString() : post.authorId.toString())
			: null;

		// Load comments for this post
		const rawComments = await Comment.getCommentsByPost(req.params.id);

		// Author name resolution:
		// We rely on `.populate("authorId", "name")` in the model layer.
		// - If the user exists: `authorId` is an object like { _id, name, ... }
		// - If the user was deleted: `authorId` is null

		// convert each comment into a plain JS object
		const comments = [];
		for (let i = 0; i < rawComments.length; i++) {
			const comment = rawComments[i];
			const commentObj = comment.toObject();

			// Convert comment image (Buffer) to base64 string for EJS
			let imageBase64 = null;
			const imageData =
				commentObj.image && commentObj.image.data ? commentObj.image.data : null;

			if (imageData) {
				try {
					if (Buffer.isBuffer(imageData)) {
						imageBase64 = imageData.toString("base64");
					} else if (typeof imageData === "string") {
						imageBase64 = Buffer.from(imageData, "binary").toString("base64");
					} else if (imageData.buffer) {
						imageBase64 = Buffer.from(imageData.buffer).toString("base64");
					}
				} catch (e) {
					console.error("Comment image conversion error:", e.message);
				}
			}

			// Highlight comment vote button for the current user (if logged in)
			let userVote = null;
			if (sessionUserId) {
				const existingVoter = commentObj.voters?.find(
					(v) => v.userId?.toString() === sessionUserId.toString(),
				);
				userVote = existingVoter ? existingVoter.voteType : null;
			}

			// Resolve display author name
			const displayAuthor =
				(commentObj.authorId && commentObj.authorId.name) ||
				"Deleted-User";

			comments.push({
				...commentObj,
				displayAuthor,
				imageBase64,
				imageType: commentObj.image ? commentObj.image.contentType : null,
				userVote,
			});
		}

		// Convert post image to base64 for EJS
		let imageBase64 = null; // set the imgb64 to null first
		if (post.image && post.image.data) {
			try {
				if (Buffer.isBuffer(post.image.data)) {
					imageBase64 = post.image.data.toString("base64");
				} else if (typeof post.image.data === "string") {
					imageBase64 = Buffer.from(post.image.data, "binary").toString("base64");
				} else if (post.image.data.buffer) {
					imageBase64 = Buffer.from(post.image.data.buffer).toString("base64");
				}
			} catch (e) {
				console.error("Image conversion error:", e.message);
			}
		}

		res.render("post/post-view", {
			post: {
				...post,
				displayAuthor:
					(post.authorId && post.authorId.name) ||
					"Deleted-User",
				imageBase64,
				imageType: post.image ? post.image.contentType : null,
			},
			comments,
			timeAgo,
			collectionList,
			currentUser,
			sessionUserId,
			isAdmin,
			editCommentId,
		});
	} catch (error) {
		console.error(error);
		res.status(500).send("Error reading post");
	}
};

exports.getUserPost = async (req, res) => {
	try {
		const userInfo = await User.findByUserID(req.session.user);
		const posts = await Post.getPostsByAuthorId(userInfo._id);

		res.render("post/myPost", { posts, timeAgo });
	} catch (error) {
		console.error(error);
		res.status(500).send("Error loading your posts");
	}
};

exports.getCreatePost = async (req, res) => {
	const user = await User.findByUserID(req.session.user)
	let communities = user.communities
	const com = []

	for (const c of communities) {
        const r = await Community.findCommunityById(c);
        com.push(r);
    }

	res.render('post/post-create', {
		user, 
		communities: com
	})
}

exports.createPost = async (req, res) => {
	const { title, community, desc } = req.body;

	if (!title || !desc) {
		return res.render('post/post-create', { error: 'Title and description are required' });
	}

	const image = req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : { data: null, contentType: null };
	const currentUser = await User.findByUserID(req.session.user) 

	const r = await Post.createPost({
		title,
		image,
		community: community == "None_Selected" ? null : community,
		desc,
		authorId: currentUser._id,
		votes: 0,
		voters: [],
		commentCount: 0,
		createdAt: new Date()
	});

	if (community !== "None_Selected") {
		await Community.addPostToCommunity(community, req.session.user, r._id)
	}

	if (!r) {
		res.send("An error has occured, please try again later");
	} else {
		res.redirect('/home');
	}
};

exports.getEditPost = async (req, res) => {
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);
	const isAdmin = userInfo?.type === "admin";

	const isOwner =
		post.authorId &&
		(post.authorId._id ? post.authorId._id.toString() : post.authorId.toString()) ===
			userInfo._id.toString();
	if (!isOwner && !isAdmin)
		return res.redirect(`/post/${req.params.id}`);

	res.render("post/post-edit", { post });
};

exports.editPost = async (req, res) => {
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);
	const isAdmin = userInfo?.type === "admin";

	const isOwner =
		post.authorId &&
		(post.authorId._id ? post.authorId._id.toString() : post.authorId.toString()) ===
			userInfo._id.toString();
	if (!isOwner && !isAdmin)
		return res.redirect(`/post/${req.params.id}`);

	const { title, tag, desc } = req.body;
	await Post.updatePost(req.params.id, { title, desc, tag });
	res.redirect(`/post/${req.params.id}`);
};

exports.deletePost = async (req, res) => {
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);
	const isAdmin = userInfo?.type === "admin";

	const isOwner =
		post.authorId &&
		(post.authorId._id ? post.authorId._id.toString() : post.authorId.toString()) ===
			userInfo._id.toString();
	if (!isOwner && !isAdmin)
		return res.redirect(`/post/${req.params.id}`);

	//delete all comments under this post.
	await Comment.deleteCommentsByPostId(req.params.id);
	await Post.deletePost(req.params.id);
	res.redirect("/home");
};
