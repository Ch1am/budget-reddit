const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo")
const User = require("./../models/registerModel")
const Community = require("./../models/communityModel")
const Comment = require("../models/commentModel");
const collectionModel = require("../models/collectionModel");
const collectionController = require("./collectionController");

exports.getSinglePost = async (req, res) => {
	try {
		// Used for inline comment editing UI (see `views/partials/comment.ejs`).
		// We toggle edit mode via `GET /post/:id?editCommentId=<commentId>#comment-<commentId>`.
		const editCommentId =
			typeof req.query.editCommentId === "string" && req.query.editCommentId.trim()
				? req.query.editCommentId.trim()
				: null;

		// Collections are now managed by `collectionModel`, not `postModel`.
		// This list is used by `views/post/post-view.ejs` to render the
		// "Add to Collection" UI.
		const collectionList = req.session?.user
			? await collectionModel.retrieveAll(req.session.user)
			: null;
		const post = await Post.getPostById(req.params.id);

		// Session user (used for edit/delete + comment vote highlighting)
		const sessionUserId = req.session?.user || null;
		const currentUser = sessionUserId ? await User.findByUserID(sessionUserId) : null;
		const sessionUser = currentUser ? currentUser.name : null; // kept for templates that still expect name

		// If post doesn't exist, still provide fields used by the template.
		if (!post) {
			return res.status(404).render("post/post-view", {
				post: null,
				comments: [],
				timeAgo,
				collectionList,
				currentUser,
				sessionUser,
				editCommentId,
			});
		}

		// Load comments for this post
		const rawComments = await Comment.getCommentsByPost(req.params.id);

		// Bulk lookup author display names (Deleted-User fallback).
		const authorIds = [
			post?.authorId ? post.authorId.toString() : null,
			...rawComments.map((c) => (c.authorId ? c.authorId.toString() : null)),
		].filter(Boolean);
		const uniqueAuthorIds = [...new Set(authorIds)];
		const authors = uniqueAuthorIds.length
			? await User.findUsersByIds(uniqueAuthorIds)
			: [];
		const authorById = new Map(authors.map((u) => [u._id.toString(), u.name]));

		const comments = rawComments.map((comment) => {
			// Convert comment image (Buffer) -> base64 string for EJS
			let imageBase64 = null;
			const imageData =
				comment.image && comment.image.data ? comment.image.data : null;

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
				const existingVoter = comment.voters?.find(
					(v) => v.userId?.toString() === sessionUserId.toString(),
				);
				userVote = existingVoter ? existingVoter.voteType : null;
			}

			return {
				...comment,
				displayAuthor:
					(comment.authorId && authorById.get(comment.authorId.toString())) ||
					"Deleted-User",
				imageBase64,
				imageType: comment.image ? comment.image.contentType : null,
				userVote,
			};
		});

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
					(post.authorId && authorById.get(post.authorId.toString())) ||
					"Deleted-User",
				imageBase64,
				imageType: post.image ? post.image.contentType : null,
			},
			comments,
			timeAgo,
			collectionList,
			currentUser,
			sessionUser,
			sessionUserId,
			editCommentId,
		});
	} catch (error) {
		console.error(error);
		res.status(500).send("Error reading post");
	}
};

exports.getUserPost = async (req, res) => {
	try {
		if (!req.session || !req.session.user) return res.redirect("/login");

		const userInfo = await User.findByUserID(req.session.user);
		const posts = await Post.getPostsByAuthorId(userInfo._id);

		res.render("post/myPost", { posts, timeAgo });
	} catch (error) {
		console.error(error);
		res.status(500).send("Error loading your posts");
	}
};

exports.getCreatePost = async (req, res) => {
	const userID = req.session.user

	const user = await User.findByUserID(userID)
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
	const { title, community, snippet } = req.body;

	if (!title || !snippet) {
		return res.render('post/post-create', { error: 'Title and description are required' });
	}

	const image = req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : { data: null, contentType: null };
	const currentUser = await User.findByUserID(req.session.user) 

	const r = await Post.createPost({
		title,
		image,
		community: community == "None_Selected" ? null : community,
		snippet,
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

// These endpoints are handled by `collectionController`.
// We keep these exports only for backward compatibility.
exports.showCollectionDetails = async (req, res) =>
	collectionController.showCollectionDetails(req, res);

exports.addInCollection = async (req, res) =>
	collectionController.addInCollection(req, res);

// exports.newCollection = async (req,res) => {
	
//   const title = req.body.title
//   try {
// 	const savedCollection = Post.createCollection(title,[])
// 	let msg = 'Collection created successfully'
//   } catch (error) {
// 	console.log(error)
// 	let msg = 'Error creating collection'
//   }
//   res.alert(msg)

// }

exports.getEditPost = async (req, res) => {
	if (!req.session || !req.session.user) return res.redirect("/login");

	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);

	const isOwner =
		post.authorId && post.authorId.toString() === userInfo._id.toString();
	if (!isOwner)
		return res.redirect(`/post/${req.params.id}`);

	res.render("post/post-edit", { post });
};

exports.editPost = async (req, res) => {
	if (!req.session || !req.session.user) return res.redirect("/login");
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);

	const isOwner =
		post.authorId && post.authorId.toString() === userInfo._id.toString();
	if (!isOwner)
		return res.redirect(`/post/${req.params.id}`);

	const { title, snippet, tag } = req.body;
	await Post.updatePost(req.params.id, { title, snippet, tag });
	res.redirect(`/post/${req.params.id}`);
};

exports.deletePost = async (req, res) => {
	if (!req.session || !req.session.user) return res.redirect("/login");
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);

	const isOwner =
		post.authorId && post.authorId.toString() === userInfo._id.toString();
	if (!isOwner)
		return res.redirect(`/post/${req.params.id}`);

	// Cascade delete all comments under this post.
	await Comment.deleteCommentsByPostId(req.params.id);
	await Post.deletePost(req.params.id);
	res.redirect("/home");
};
