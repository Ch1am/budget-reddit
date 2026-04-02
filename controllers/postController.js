const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo")
const { validateImageUrl } = require("../functions/validateImageUrl")
const User = require("./../models/registerModel")
const Community = require("./../models/communityModel")
const Comment = require("../models/commentModel");
const collectionModel = require("../models/collectionModel");
const mongoose = require("mongoose");

// Populated author looks like { _id, name }; deleted users become null.
function displayAuthorName(author) {
	if (author && author.name) return author.name;
	return "Deleted-User";
}

// Turn a Mongoose comment into a plain object the EJS partials expect.
function shapeCommentForView(commentDoc, sessionUserId) {
	const plain = commentDoc.toObject();

	let userVote = null;
	if (sessionUserId && plain.voters && plain.voters.length > 0) {
		const myVote = plain.voters.find(
			(entry) => entry.userId && entry.userId.toString() === sessionUserId.toString(),
		);
		if (myVote) userVote = myVote.voteType;
	}

	return {
		...plain,
		displayAuthor: displayAuthorName(plain.authorId),
		userVote,
	};
}

exports.getSinglePost = async (req, res) => {
	try {
		const sessionUserId = req.session.user;

		const editCommentId =
			typeof req.query.editCommentId === "string" && req.query.editCommentId.trim()
				? req.query.editCommentId.trim()
				: null;

		const commentImageInvalid = req.query.invalidImage === "1";
		const commentEditImageInvalid = req.query.invalidCommentImage === "1";

		const collectionList = await collectionModel.retrieveAll(sessionUserId);
		const currentUser = await User.findByUserID(sessionUserId);
		const isAdmin = currentUser?.type === "admin";

		const sharedForTemplate = {
			timeAgo,
			collectionList,
			currentUser,
			sessionUserId,
			isAdmin,
			editCommentId,
			commentImageInvalid,
			commentEditImageInvalid,
		};

		const postDoc = await Post.getPostById(req.params.id);
		if (!postDoc) 
			return res.status(404).send("Post not found");

		const post = postDoc.toObject();
		const commentDocs = await Comment.getCommentsByPost(req.params.id);
		const comments = commentDocs.map((doc) => shapeCommentForView(doc, sessionUserId));

		res.render("post/post-view", {
			...sharedForTemplate,
			post: {
				...post,
				displayAuthor: displayAuthorName(post.authorId),
				imageType: post.image || null,
			},
			comments,
		});
	} catch (error) {
		res.send(`
			Post do not exist!<br><br>
			You will be redirected to the home page in 3 seconds...
			<script>
				setTimeout(() => {
					window.location.href = "/home";
				}, 3000);
			</script>
		`);
	}
};

//This function gets all posts made by user logged in
exports.getUserPost = async (req, res) => {
	try {
		const userInfo = await User.findByUserID(req.session.user);
		const posts = await Post.getPostsByAuthorId(userInfo._id); //using getPostsByAuthorId retrieves all posts where userID = the logged in user ID

		//postsWithAuthor maps to a new array and adds displayAuthor name to the object, so in EJS, i can jst call displayAuthor for the name.
		const postsWithAuthor = posts.map((post) => {
			return {
				...post.toObject(), //converts the mongoose post to a js object 
				displayAuthor: (post.authorId && post.authorId.name) || 'Deleted-User'
			};
		});
		res.render("post/myPost", { posts: postsWithAuthor, timeAgo });

	} catch (error) {
		console.error(error);
		res.status(500).send("Error loading your posts");
	}
};

exports.getCreatePost = async (req, res) => {
	try {
		const user = await User.findByUserID(req.session.user)
		let communities = user.communities
		const com = []

		for (const c of communities) {
			const r = await Community.findCommunityById(c);
			com.push(r);
		}

		res.render('post/post-create', {
			user,
			communities: com, //will render any communities the user has joined into the dropdown bar
			error: req.query.error || null //handles any error queries which occur when creating the post
		})
	} catch (error) {
		console.error(error);
		res.status(500).send("Error loading create post page");
	}
}

exports.createPost = async (req, res) => {
	try {
		const { title, community, desc } = req.body;

		if (!title || !title.trim() || !desc || !desc.trim()) { //using trim() helps with whitespaces
			return res.redirect('/post/create?error=Title and description are required');
		}

		const image = req.body.image ? req.body.image.trim() : null;

		if (image && !(await validateImageUrl(image))) {
			return res.redirect(
				"/post/create?error=Image URL must include .png, .jpg, .jpeg, .gif, or .webp",
			);
		}

		const currentUser = await User.findByUserID(req.session.user)

		const r = await Post.createPost({
			title,
			image: image || null,
			community: community == "None_Selected" ? null : community,
			desc,
			authorId: currentUser._id,
			votes: 0,
			voters: [],
			commentCount: 0,
			createdAt: new Date()
		});

		//a check so that user cant post to a community that they havent joined
		if (community !== "None_Selected") {
			let isMember = false;
			for (const c of currentUser.communities) {
				if (c.toString() === community) {
					isMember = true;
					break;
				}
			}
			if (!isMember) {
				return res.redirect('/post/create?error=You are not a member of that community');
			}

			await Community.addPostToCommunity(community, req.session.user, r._id)
		}

		if (!r) {
			res.send("An error has occured, please try again later");
		} else {
			res.redirect('/home');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send("Error creating post");
	}
};

exports.getEditPost = async (req, res) => {
	try {
		const post = await Post.getPostById(req.params.id);
		res.render("post/post-edit", { post, error: req.query.error || null });
	} catch (error) {
		console.error(error);
		res.status(500).send("Error loading edit post page");
	}
};

exports.editPost = async (req, res) => {
	try {
		const { title, image, tag, desc } = req.body;

		if (!title || !title.trim() || !desc || !desc.trim()) {
			return res.redirect(`/post/${req.params.id}/edit?error=Title and description are required`);
		}

		if (
			typeof image === "string" &&
			image.trim() &&
			!(await validateImageUrl(image.trim()))
		) {
			return res.redirect(
				`/post/${req.params.id}/edit?error=Image URL must include .png, .jpg, .jpeg, .gif, or .webp`,
			);
		}

		await Post.updatePost(req.params.id, { title, image, desc, tag });
		res.redirect(`/post/${req.params.id}`);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error updating post");
	}
};

exports.deletePost = async (req, res) => {
	try {
		//delete all comments under this post.

		const postID = req.params.id
		const post = await Post.getPostById(postID);

		if (post) {
			if (post.community) {
				const communityID = new mongoose.Types.ObjectId(post.community);
				await Community.deletePostFromCommunity(communityID, postID);
			}

			await Comment.deleteCommentsByPostId(req.params.id);
			await Post.deletePost(req.params.id);
		}

		res.redirect("/home");
	} catch (error) {
		console.error(error);
		res.status(500).send("Error deleting post");
	}
};
